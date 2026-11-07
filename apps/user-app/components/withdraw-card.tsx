"use client";

import { useState, useTransition } from "react";
import { Input } from "@wallet/ui/components/ui/input";
import { Label } from "@wallet/ui/components/ui/label";
import { Button } from "@wallet/ui/components/ui/button";
import {
  ArrowRight,
  ShieldCheck,
  RotateCw,
  Building2,
  Plus,
  Minus,
  CheckCircle2,
} from "lucide-react";
import { initiateWithdrawalAction } from "@/app/actions/initWithdrawAction";
import { useRouter } from "next/navigation";

interface WithdrawCardProps {
  balance: number;
}

const getSafeIdempotencyKey = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `idemp_${Date.now()}`;

export default function WithdrawCard({ balance }: WithdrawCardProps) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(1000);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(getSafeIdempotencyKey);
  const [isPending, startTransition] = useTransition();

  const presets = [
    { label: "25%", value: Math.floor(balance * 0.25) },
    { label: "50%", value: Math.floor(balance * 0.5) },
    { label: "75%", value: Math.floor(balance * 0.75) },
    { label: "MAX", value: balance },
  ];

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 100) return setError("Minimum withdrawal amount is ₹100.");
    if (amount > balance) return setError("Entered amount exceeds your available balance.");

    setError(null);

    startTransition(async () => {
      try {
        const res = await initiateWithdrawalAction({ amount, idempotencyKey });
        router.push(`/payment-success?txId=${res.id}`);
      } catch (err) {
        console.error("Withdrawal Error:", err);
        setError("Network timeout. You can safely retry without duplicating requests.");
        // Rotate idempotency key safely on failure retry if needed, or keep it 
        // depending on whether the request reached the server.
      }
    });
  };

  return (
    <div className="w-full max-w-md rounded-none border bg-card p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Withdraw Funds</h3>
          <p className="text-xs text-muted-foreground">Transfer funds to your verified bank account</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Verified</span>
        </div>
      </div>

      <form onSubmit={handleWithdraw} className="space-y-6">
        {/* Balance Banner */}
        <div className="flex items-center justify-between bg-muted/40 p-3 border border-border/60">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Available Balance</span>
          <span className="text-base font-bold tracking-tight">₹{balance.toLocaleString("en-IN")}</span>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Enter Amount (₹)
          </Label>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setAmount((prev) => Math.max(100, prev - 500))}
              disabled={amount <= 100 || isPending}
              className="h-10 w-10 shrink-0 rounded-none"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
              <Input
                type="number"
                min={100}
                max={balance}
                value={amount || ""}
                onChange={(e) => {
                  setAmount(Number(e.target.value));
                  if (error) setError(null);
                }}
                disabled={isPending}
                className="pl-7 text-lg font-semibold tracking-tight h-10 rounded-none"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setAmount((prev) => Math.min(balance, prev + 500))}
              disabled={amount >= balance || isPending}
              className="h-10 w-10 shrink-0 rounded-none"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2 pt-1">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setAmount(p.value)}
                disabled={isPending}
                className={`rounded-none px-2.5 py-1 text-xs font-medium transition-colors border ${
                  amount === p.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted text-muted-foreground border-input"
                }`}
              >
                {p.label} (₹{p.value.toLocaleString("en-IN")})
              </button>
            ))}
          </div>
        </div>

        {/* Destination */}
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Withdrawal Destination
          </Label>
          <div className="flex items-center justify-between border p-3 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background border">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-semibold">HDFC Bank •••• 4092</p>
                <p className="text-[11px] text-muted-foreground">Primary Account</p>
              </div>
            </div>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          </div>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="rounded-none bg-destructive/15 p-3 text-xs text-destructive border border-destructive/30 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setIdempotencyKey(getSafeIdempotencyKey());
              }}
              className="underline text-[11px] font-medium ml-2 shrink-0"
            >
              Reset Key
            </button>
          </div>
        )}

        {/* Action Button */}
        <Button
          type="submit"
          disabled={isPending || amount <= 0 || amount > balance}
          className="w-full h-11 font-medium text-sm rounded-none"
        >
          {isPending ? (
            <>
              <RotateCw className="mr-2 h-4 w-4 animate-spin" />
              Processing Withdrawal...
            </>
          ) : (
            <>
              {error ? "Retry Withdrawal" : `Continue with ₹${amount.toLocaleString("en-IN")}`}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}