"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@wallet/ui/components/ui/button";

type Status = "PENDING" | "SUCCESS" | "FAILED" | "ERROR";

const POLL_INTERVAL_MS = 1000;
const MAX_ATTEMPTS = 60; // ~1 minute

export function PaymentStatus({ txId }: { txId: string }) {
  const router = useRouter();

  const [status, setStatus] = useState<Status>("PENDING");
  const [txType, setTxType] = useState<"DEPOSIT" | "WITHDRAWAL" | null>(null);
  const [amount, setAmount] = useState<number | null>(null);

  const getSuccessTitle = () => {
    if (txType === "DEPOSIT") return "Deposit Successful";
    if (txType === "WITHDRAWAL") return "Withdrawal Successful";
    return "Transaction Successful";
  };

  useEffect(() => {
    let isMounted = true;
    let attempts = 0;

    const stop = () => clearInterval(intervalId);

    const pollStatus = async () => {
      attempts++;

      try {
        const res = await fetch(
          `/api/transaction/status?txId=${encodeURIComponent(txId)}`,
          { cache: "no-store" },
        );

        if (!res.ok) {
          // 400/401/404 won't fix themselves, so stop polling
          stop();
          if (isMounted) setStatus("ERROR");
          return;
        }

        const data = await res.json();

        if (isMounted) {
          setStatus(data.status);
          setTxType(data.type);
          if (data.amount) setAmount(data.amount);
        }

        if (data.status !== "PENDING") {
          stop();
          return;
        }
      } catch (err) {
        // Network blip: keep trying until the attempt cap
        console.error("Polling error:", err);
      }

      if (attempts >= MAX_ATTEMPTS) {
        stop();
        if (isMounted) setStatus((s) => (s === "PENDING" ? "ERROR" : s));
      }
    };

    const intervalId = setInterval(pollStatus, POLL_INTERVAL_MS);
    pollStatus();

    return () => {
      isMounted = false;
      stop();
    };
  }, [txId]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm border rounded-xl bg-card p-6 shadow-sm text-center space-y-6">
        {/* PENDING */}
        {status === "PENDING" && (
          <div className="space-y-4 py-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <div className="space-y-1">
              <h2 className="text-lg font-bold">Processing Payment</h2>
              <p className="text-xs text-muted-foreground">
                Please wait while we confirm your transaction with the bank...
              </p>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {status === "SUCCESS" && (
          <div className="space-y-4 py-2 animate-in fade-in zoom-in-95 duration-300">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">
                {getSuccessTitle()}
              </h2>

              {amount !== null && (
                <p className="text-2xl font-extrabold text-emerald-600">
                  {txType === "WITHDRAWAL" ? "-" : "+"}₹
                  {amount.toLocaleString("en-IN")}
                </p>
              )}
              <p className="text-xs text-muted-foreground pt-1">
                Your wallet balance has been updated.
              </p>
            </div>

            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full h-11 text-sm font-semibold mt-4"
            >
              Back to Wallet
            </Button>
          </div>
        )}

        {/* FAILED */}
        {status === "FAILED" && (
          <div className="space-y-4 py-2 animate-in fade-in zoom-in-95 duration-300">
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">
                Payment Failed
              </h2>
              <p className="text-xs text-muted-foreground">
                The transaction was declined by the bank or timed out.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="w-full h-11 text-sm font-semibold mt-4"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* ERROR (not found, not yours, or timed out) */}
        {status === "ERROR" && (
          <div className="space-y-4 py-2 animate-in fade-in zoom-in-95 duration-300">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">
                Couldn&apos;t confirm this transaction
              </h2>
              <p className="text-xs text-muted-foreground">
                We couldn&apos;t find this transaction or it is taking too long.
                Check your transaction history for the latest status.
              </p>
            </div>

            <Button
              onClick={() => router.push("/transactions")}
              className="w-full h-11 text-sm font-semibold mt-4"
            >
              View Transactions
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
