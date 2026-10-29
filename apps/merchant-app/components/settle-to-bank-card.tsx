"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@wallet/ui/components/ui/card";
import { Button } from "@wallet/ui/components/ui/button";
import { Input } from "@wallet/ui/components/ui/input";
import { ArrowUpRight, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { handleSettleToBank } from "@/app/actions/settleToBankAction";

interface SettleToBankCardProps {
  availableBalance: number;
}

export function SettleToBankCard({ availableBalance }: SettleToBankCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  // Polling state variables
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<
    "IDLE" | "PROCESSING" | "SUCCESS" | "FAILED"
  >("IDLE");

  // Polling effect matching user-app pattern
  useEffect(() => {
    if (!activeTxId) return;

    let isMounted = true;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/transaction/status?txId=${activeTxId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        if (isMounted) {
          setTxStatus(data.status);
        }

        // Stop polling and refresh UI once resolved
        if (data.status === "SUCCESS" || data.status === "FAILED") {
          clearInterval(intervalId);
          router.refresh(); // Automatically updates the dashboard cards smoothly!
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    const intervalId = setInterval(pollStatus, 1000);
    pollStatus();

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [activeTxId, router]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setTxStatus("IDLE");

    const formData = new FormData(e.currentTarget);
    const idempotencyKey = crypto.randomUUID();
    formData.append("idempotencyKey", idempotencyKey);

    startTransition(async () => {
      try {
        const result = await handleSettleToBank(formData);
        if (result?.success && result.txId) {
          setAmount("");
          setActiveTxId(result.txId);
          setTxStatus("PROCESSING"); // Start polling loop
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to initiate payout.");
        }
        setTxStatus("IDLE");
      }
    });
  };

  const handleReset = () => {
    setTxStatus("IDLE");
    setActiveTxId(null);
  };

  return (
    <Card className="md:col-span-3">
      <CardHeader>
        <CardTitle>Settle to Bank</CardTitle>
      </CardHeader>
      <CardContent>
        {/* State 1 & Initial: Form Input */}
        {txStatus === "IDLE" && (
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="p-2 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Settlement Amount (₹)
              </label>
              <Input
                name="amount"
                type="number"
                step="0.01"
                max={availableBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Max ₹${availableBalance}`}
                disabled={isPending}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full gap-2 rounded-none"
              disabled={isPending || availableBalance <= 0}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Initiating Payout...
                </>
              ) : (
                <>
                  Initiate Instant Payout <ArrowUpRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* State 2: PROCESSING (Polling Loader) */}
        {txStatus === "PROCESSING" && (
          <div className="py-8 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-sm font-medium">Processing bank settlement...</p>
            <p className="text-xs text-muted-foreground">
              Checking status with mock bank gateway.
            </p>
          </div>
        )}

        {/* State 3: SUCCESS */}
        {txStatus === "SUCCESS" && (
          <div className="py-6 text-center space-y-4 animate-in fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <div>
              <h3 className="font-bold text-base">Payout Successful!</h3>
              <p className="text-xs text-muted-foreground">
                Funds have cleared your locked balance.
              </p>
            </div>
            <Button onClick={handleReset} variant="outline" className="w-full">
              New Settlement
            </Button>
          </div>
        )}

        {/* State 4: FAILED */}
        {txStatus === "FAILED" && (
          <div className="py-6 text-center space-y-4 animate-in fade-in">
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <div>
              <h3 className="font-bold text-base">Payout Failed</h3>
              <p className="text-xs text-muted-foreground">
                Bank declined transaction. Funds refunded to balance.
              </p>
            </div>
            <Button onClick={handleReset} variant="outline" className="w-full">
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
