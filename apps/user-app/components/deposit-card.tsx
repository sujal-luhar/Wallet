"use client";

import { useState, useTransition } from "react";
import { Input } from "@wallet/ui/components/ui/input";
import { Label } from "@wallet/ui/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@wallet/ui/components/ui/radio-group";
import { Button } from "@wallet/ui/components/ui/button";
import {
  Plus,
  Minus,
  RotateCw,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { initDepositAction } from "@/app/actions/initDepositAction";

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

  const PRESETS = [500, 1000, 2000, 5000];

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 100) return setError("Minimum deposit amount is ₹100");

    setError(null);

    startTransition(async () => {
      try {
        const res = await initDepositAction({ amount, idempotencyKey });

        const bankBaseUrl =
          process.env.NEXT_PUBLIC_MOCK_BANK_URL || "http://localhost:3001";
        const mockbankDepositURL = `${bankBaseUrl}/mock-bank/pay?txnId=${res.id}`;

        window.location.replace(mockbankDepositURL);
      } catch (err) {
        console.error("Deposit Error:", err);
        setError("Network connection failed. You can safely retry without double-charging.");
      }
    });
  };

  return (
    <div className="w-full max-w-md rounded-none border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Add Funds</h3>
          <p className="text-xs text-muted-foreground">
            Top up your wallet balance instantly
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Secure</span>
        </div>
      </div>

      <form onSubmit={handleDeposit} className="space-y-6">
        {/* Amount Input with Stepper */}
        <div className="space-y-2">
          <Label
            htmlFor="amount"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                ₹
              </span>
              <Input
                id="amount"
                type="number"
                min={100}
                step={100}
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
              onClick={() => setAmount((prev) => prev + 500)}
              disabled={isPending}
              className="h-10 w-10 shrink-0 rounded-none"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Preset Chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                disabled={isPending}
                className={`rounded-none px-2.5 py-1 text-xs font-medium transition-colors border ${
                  amount === preset
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted text-muted-foreground border-input"
                }`}
              >
                +₹{preset.toLocaleString("en-IN")}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method Selector */}
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
                  paymentMethod === method.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
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

        {/* Error Feedback Banner */}
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

        {/* Single Streamlined Action Button */}
        <Button
          type="submit"
          disabled={isPending || amount <= 0}
          className="w-full h-11 font-medium text-sm rounded-none"
        >
          {isPending ? (
            <>
              <RotateCw className="mr-2 h-4 w-4 animate-spin" />
              Connecting to Bank Gateway...
            </>
          ) : (
            <>
              {error ? "Try Again" : `Proceed to Add ₹${amount.toLocaleString("en-IN")}`}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}