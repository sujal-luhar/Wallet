"use client";

import { useState } from "react";
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
  X,
} from "lucide-react";
import { initDepositAction } from "@/app/actions/initDepositAction";

export default function DepositCard() {
  const [amount, setAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<string>("mock_bank");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Initialize Idempotency Key once safely (fixes TS error)
  const generateKey = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `idemp_${Date.now()}`;

  const [idempotencyKey, setIdempotencyKey] = useState<string>(generateKey);

  // Quick Preset Chips
  const PRESETS = [500, 1000, 2000, 5000];

  // ₹500 Stepper handlers
  const handleIncrement = () => setAmount((prev) => prev + 500);
  const handleDecrement = () => setAmount((prev) => Math.max(500, prev - 500));
  const handlePresetClick = (preset: number) => setAmount(preset);

  // Cancel Handler: Resets error and generates a BRAND NEW Idempotency Key
  const handleCancel = () => {
    setError(null);
    setIsSubmitting(false);
    setIdempotencyKey(generateKey());
  };

  // Submit Handler: Keeps using the EXISTING Idempotency Key (even during Retries)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 100) {
      setError("Minimum deposit amount is ₹100");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      console.log("Initiating deposit with Key:", idempotencyKey, {
        amount,
        paymentMethod,
      });

      // TODO: Replace with your actual Server Action or fetch call
      const res = await initDepositAction({ amount, idempotencyKey });

      const bankBaseUrl =
        process.env.NEXT_PUBLIC_MOCK_BANK_URL || "http://localhost:3001";
      const mockbankDepositURL = `${bankBaseUrl}/mock-bank/pay?txnId=${res.id}`;

      window.location.replace(mockbankDepositURL);
    } catch (err) {
      console.error("Deposit Error:", err);
      setError(
        "Network connection failed. You can safely retry without double-charging.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-none font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Secure</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
              onClick={handleDecrement}
              disabled={amount <= 500 || isSubmitting}
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
                id="amount"
                type="number"
                min={100}
                step={100}
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
              disabled={isSubmitting || !!error}
              className="h-10 w-10 shrink-0 rounded-none"
              title="Increase by ₹500"
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
                onClick={() => handlePresetClick(preset)}
                disabled={isSubmitting || !!error}
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
            disabled={isSubmitting || !!error}
            className="grid gap-2"
          >
            <div
              className={`flex items-center justify-between border p-3 cursor-pointer rounded-none transition-colors ${
                paymentMethod === "mock_bank"
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
              onClick={() =>
                !isSubmitting && !error && setPaymentMethod("mock_bank")
              }
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem
                  value="mock_bank"
                  id="pm-mock"
                  className="rounded-none"
                />
                <Label htmlFor="pm-mock" className="cursor-pointer font-medium">
                  Mock Bank (Development)
                </Label>
              </div>
              <span className="text-[10px] font-semibold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-none">
                Test Mode
              </span>
            </div>

            <div
              className={`flex items-center justify-between border p-3 cursor-pointer rounded-none transition-colors ${
                paymentMethod === "upi"
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => !isSubmitting && !error && setPaymentMethod("upi")}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem
                  value="upi"
                  id="pm-upi"
                  className="rounded-none"
                />
                <Label htmlFor="pm-upi" className="cursor-pointer font-medium">
                  UPI Instant Transfer
                </Label>
              </div>
            </div>

            <div
              className={`flex items-center justify-between border p-3 cursor-pointer rounded-none transition-colors ${
                paymentMethod === "netbanking"
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
              onClick={() =>
                !isSubmitting && !error && setPaymentMethod("netbanking")
              }
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem
                  value="netbanking"
                  id="pm-net"
                  className="rounded-none"
                />
                <Label htmlFor="pm-net" className="cursor-pointer font-medium">
                  NetBanking
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Error Feedback Banner */}
        {error && (
          <div className="rounded-none bg-destructive/15 p-3 text-xs text-destructive border border-destructive/30">
            {error}
          </div>
        )}

        {/* Dynamic Action Buttons Section */}
        {error ? (
          /* When Error Occurs: Show side-by-side Retry and Cancel buttons */
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
          /* Normal State: Show Primary Action Button */
          <Button
            type="submit"
            disabled={isSubmitting || amount <= 0}
            className="w-full h-11 font-medium text-sm rounded-none"
          >
            {isSubmitting ? (
              <>
                <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                Connecting to Bank Gateway...
              </>
            ) : (
              <>
                Proceed to Add ₹{amount ? amount.toLocaleString("en-IN") : "0"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </form>
    </div>
  );
}
