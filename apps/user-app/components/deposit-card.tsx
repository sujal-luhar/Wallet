"use client";

import { useState, useTransition } from "react";
import { Label } from "@wallet/ui/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@wallet/ui/components/ui/radio-group";
import { ShieldCheck } from "lucide-react";
import { initDepositAction } from "@/app/actions/initDepositAction";
import { AmountActionCardWrapper } from "@/components/amount-action-card-wrapper";

const getSafeIdempotencyKey = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `idemp_${Date.now()}`;

export default function DepositCard() {
  const [amount, setAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<string>("mock_bank");
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(getSafeIdempotencyKey);
  const [isPending, startTransition] = useTransition();

  const presets = [500, 1000, 2000, 5000].map((v) => ({ label: `+₹${v}`, value: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 100) return setError("Minimum deposit amount is ₹100");

    setError(null);
    startTransition(async () => {
      try {
        const res = await initDepositAction({ amount, idempotencyKey });
        const bankBaseUrl = process.env.NEXT_PUBLIC_MOCK_BANK_URL || "http://localhost:3001";
        window.location.replace(`${bankBaseUrl}/mock-bank/pay?txnId=${res.id}`);
      } catch (err) {
        console.error("Deposit Error:", err);
        setError("Network connection failed. You can safely retry without double-charging.");
      }
    });
  };

  return (
    <AmountActionCardWrapper
      title="Add Funds"
      subtitle="Top up your wallet balance instantly"
      badge={
        <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Secure</span>
        </div>
      }
      amount={amount}
      setAmount={setAmount}
      minAmount={100}
      step={100}
      presets={presets}
      isPending={isPending}
      error={error}
      onErrorReset={() => {
        setError(null);
        setIdempotencyKey(getSafeIdempotencyKey());
      }}
      onSubmit={handleSubmit}
      submitButtonText="Proceed to Add"
    >
      {/* Unique Deposit Feature: Payment Method Selector */}
      <div className="space-y-3">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Select Payment Method
        </Label>
        <RadioGroup
          value={paymentMethod}
          onValueChange={setPaymentMethod}
          disabled={isPending}
          className="grid gap-2"
        >
          {[
            { id: "mock_bank", label: "Mock Bank (Development)", tag: "Test Mode" },
            { id: "upi", label: "UPI Instant Transfer" },
            { id: "netbanking", label: "NetBanking" },
          ].map((method) => (
            <div
              key={method.id}
              className={`flex items-center justify-between border p-3 cursor-pointer rounded-none transition-colors ${
                paymentMethod === method.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
              onClick={() => !isPending && setPaymentMethod(method.id)}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value={method.id} id={`pm-${method.id}`} className="rounded-none" />
                <Label htmlFor={`pm-${method.id}`} className="cursor-pointer font-medium">
                  {method.label}
                </Label>
              </div>
              {method.tag && (
                <span className="text-[10px] font-semibold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-none">
                  {method.tag}
                </span>
              )}
            </div>
          ))}
        </RadioGroup>
      </div>
    </AmountActionCardWrapper>
  );
}