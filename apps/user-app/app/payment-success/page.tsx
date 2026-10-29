"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@wallet/ui/components/ui/button";

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const txId = searchParams.get("txId");

  const [status, setStatus] = useState<"PENDING" | "SUCCESS" | "FAILED">(
    "PENDING",
  );
  const [txType, setTxType] = useState<"DEPOSIT" | "WITHDRAWAL" | null>(null);
  const [amount, setAmount] = useState<number | null>(null);

  // Helper for dynamic success title
  const getSuccessTitle = () => {
    if (txType === "DEPOSIT") return "Deposit Successful";
    if (txType === "WITHDRAWAL") return "Withdrawal Successful";
    return "Transaction Successful";
  };

  useEffect(() => {
    if (!txId) return;

    let isMounted = true;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/transaction/status?txId=${txId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        if (isMounted) {
          setStatus(data.status);
          setTxType(data.type);
          if (data.amount) setAmount(data.amount);
        }

        // Stop polling if status is no longer PENDING
        if (data.status === "SUCCESS" || data.status === "FAILED") {
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    // Poll every 1 second
    const intervalId = setInterval(pollStatus, 1000);
    pollStatus(); // Initial fetch immediately

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [txId]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm border rounded-xl bg-card p-6 shadow-sm text-center space-y-6">
        {/* State 1: PENDING (Loading) */}
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

        {/* State 2: SUCCESS */}
        {status === "SUCCESS" && (
          <div className="space-y-4 py-2 animate-in fade-in zoom-in-95 duration-300">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <div className="space-y-1">
              {/* Clean, secure dynamic title directly from database record */}
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

        {/* State 3: FAILED */}
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
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  );
}
