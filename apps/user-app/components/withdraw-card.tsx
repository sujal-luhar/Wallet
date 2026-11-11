"use client";

import { useState, useTransition } from "react";
import { Label } from "@wallet/ui/components/ui/label";
import { ShieldCheck, Building2, CheckCircle2 } from "lucide-react";
import { initiateWithdrawalAction } from "@/app/actions/tx.withdraw.action";
import { useRouter } from "next/navigation";
import { AmountActionCardWrapper } from "@/components/amount-action-card-wrapper";

interface WithdrawCardProps {
  balance: number;
}

export default function WithdrawCard({ balance }: WithdrawCardProps) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(1000);
  const [error, setError] = useState<string | null>(null);
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
    if (amount > balance)
      return setError("Entered amount exceeds your available balance.");

    setError(null);

    startTransition(async () => {
      const idempotencyKey = `withdraw_${crypto.randomUUID()}`;

      const res = await initiateWithdrawalAction({ amount, idempotencyKey });

      if (!res.success) {
        setError(res.error);
        return;
      }

      router.push(`/payment-success?txId=${res.id}`);
    });
  };

  return (
    <AmountActionCardWrapper
      title="Withdraw Funds"
      subtitle="Transfer funds to your verified bank account"
      badge={
        <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Verified</span>
        </div>
      }
      amount={amount}
      setAmount={setAmount}
      minAmount={100}
      maxAmount={balance}
      step={1}
      presets={presets}
      isPending={isPending}
      error={error}
      onErrorReset={() => {
        setError(null);
      }}
      onSubmit={handleWithdraw}
      submitButtonText="Continue with"
    >
      {/* Unique Withdraw Feature 1: Balance Banner */}
      <div className="flex items-center justify-between bg-muted/40 p-3 border border-border/60">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Available Balance
        </span>
        <span className="text-base font-bold tracking-tight">
          ₹{balance.toLocaleString("en-IN")}
        </span>
      </div>

      {/* Unique Withdraw Feature 2: Destination Account Display */}
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
                Primary Account
              </p>
            </div>
          </div>
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        </div>
      </div>
    </AmountActionCardWrapper>
  );
}
