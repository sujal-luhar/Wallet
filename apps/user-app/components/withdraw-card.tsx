"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ShieldCheck,
  RotateCw,
  Building2,
  Plus,
  Minus,
  X,
  CheckCircle2,
} from "lucide-react";
import { initiateWithdrawalAction } from "@/app/actions/initWithdrawAction";
import { useRouter } from "next/navigation";

interface WithdrawCardProps {
  balance: number;
}

export default function WithdrawCard({ balance }: WithdrawCardProps) {
  const [amount, setAmount] = useState<number>(1000);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter()

  // Available Balance (typically passed as a prop or fetched via SWR/RSC)
  const availableBalance = balance

  // Safe Idempotency Key generator
  const generateKey = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `idemp_${Date.now()}`;

  const [idempotencyKey, setIdempotencyKey] = useState<string>(generateKey);

  // Preset quick percentages
  const PRESETS = [
    { label: "25%", value: Math.floor(availableBalance * 0.25) },
    { label: "50%", value: Math.floor(availableBalance * 0.5) },
    { label: "75%", value: Math.floor(availableBalance * 0.75) },
    { label: "MAX", value: availableBalance },
  ];

  // ₹500 Stepper handlers
  const handleIncrement = () =>
    setAmount((prev) => Math.min(availableBalance, prev + 500));
  const handleDecrement = () =>
    setAmount((prev) => Math.max(100, prev - 500));

  // Cancel Handler
  const handleCancel = () => {
    setError(null);
    setIsSubmitting(false);
    setIdempotencyKey(generateKey());
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount < 100) {
      setError("Minimum withdrawal amount is ₹100.");
      return;
    }

    if (amount > availableBalance) {
      setError("Entered amount exceeds your available balance.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      console.log("Initiating withdrawal with Key:", idempotencyKey, {
        amount,
      });

      // TODO: Replace with your actual Server Action or fetch call
      const res = await initiateWithdrawalAction({ amount, idempotencyKey });

      // Redirect straight to polling page (reuse the same /payment-success polling UI!)
      router.push(`/payment-success?txId=${res.id}`);

    } catch (err) {
      console.error("Withdrawal Error:", err);
      setError("Network timeout. You can safely retry without duplicating requests.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-none border bg-card p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Withdraw Funds</h3>
          <p className="text-xs text-muted-foreground">
            Transfer funds to your verified bank account
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-none font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Verified</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Available Balance Banner */}
        <div className="flex items-center justify-between bg-muted/40 p-3 border border-border/60">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Available Balance
          </span>
          <span className="text-base font-bold tracking-tight">
            ₹{availableBalance.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Amount Input with Stepper */}
        <div className="space-y-2">
          <Label
            htmlFor="withdraw-amount"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Enter Amount (₹)
          </Label>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              disabled={amount <= 100 || isSubmitting || !!error}
              className="h-10 w-10 shrink-0 rounded-none"
              title="Decrease by ₹500"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                ₹
              </span>
              <Input
                id="withdraw-amount"
                type="number"
                min={100}
                max={availableBalance}
                value={amount || ""}
                onChange={(e) => {
                  setAmount(Number(e.target.value));
                  if (error) setError(null);
                }}
                disabled={isSubmitting || !!error}
                className="pl-7 text-lg font-semibold tracking-tight h-10 rounded-none"
                placeholder="1000"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              disabled={amount >= availableBalance || isSubmitting || !!error}
              className="h-10 w-10 shrink-0 rounded-none"
              title="Increase by ₹500"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Percentage Presets */}
          <div className="flex flex-wrap gap-2 pt-1">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setAmount(preset.value)}
                disabled={isSubmitting || !!error}
                className={`rounded-none px-2.5 py-1 text-xs font-medium transition-colors border ${amount === preset.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted text-muted-foreground border-input"
                  }`}
              >
                {preset.label} (₹{preset.value.toLocaleString("en-IN")})
              </button>
            ))}
          </div>
        </div>

        {/* Target Destination Display */}
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
                <p className="text-[11px] text-muted-foreground">
                  Primary Account (Instant Processing)
                </p>
              </div>
            </div>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          </div>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="rounded-none bg-destructive/15 p-3 text-xs text-destructive border border-destructive/30">
            {error}
          </div>
        )}

        {/* Dynamic Action Buttons Section */}
        {error ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="w-1/2 h-11 font-medium text-sm rounded-none"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-1/2 h-11 font-medium text-sm rounded-none"
            >
              {isSubmitting ? (
                <RotateCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Retry
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button
            type="submit"
            disabled={isSubmitting || amount <= 0 || amount > availableBalance}
            className="w-full h-11 font-medium text-sm rounded-none"
          >
            {isSubmitting ? (
              <>
                <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                Processing Withdrawal...
              </>
            ) : (
              <>
                Continue with ₹{amount ? amount.toLocaleString("en-IN") : "0"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </form>
    </div>
  );
}