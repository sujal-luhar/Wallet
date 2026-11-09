"use client";

import { ReactNode } from "react";
import { Input } from "@wallet/ui/components/ui/input";
import { Label } from "@wallet/ui/components/ui/label";
import { Button } from "@wallet/ui/components/ui/button";
import { Plus, Minus, RotateCw, ArrowRight } from "lucide-react";

interface AmountActionCardWrapperProps {
  title: string;
  subtitle: string;
  badge: ReactNode;
  amount: number;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
  minAmount?: number;
  maxAmount?: number;
  step?: number;
  presets: { label: string; value: number }[];
  isPending: boolean;
  error: string | null;
  onErrorReset: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitButtonText: string;
  children?: ReactNode; // For unique middle sections (Balance banner, Payment methods, Destination)
}

export function AmountActionCardWrapper({
  title,
  subtitle,
  badge,
  amount,
  setAmount,
  minAmount = 100,
  maxAmount,
  step = 1,
  presets,
  isPending,
  error,
  onErrorReset,
  onSubmit,
  submitButtonText,
  children,
}: AmountActionCardWrapperProps) {
  return (
    <div className="w-full max-w-md rounded-none border bg-card p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {badge}
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Amount Input with Stepper (100% Shared) */}
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Enter Amount (₹)
          </Label>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() =>
                setAmount((prev) => Math.max(minAmount, prev - 500))
              }
              disabled={amount <= minAmount || isPending}
              className="h-10 w-10 shrink-0 rounded-none"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                ₹
              </span>
              <Input
                type="number"
                min={minAmount}
                max={maxAmount}
                step={step}
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                disabled={isPending}
                className="pl-7 text-lg font-semibold tracking-tight h-10 rounded-none"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() =>
                setAmount((prev) =>
                  maxAmount !== undefined
                    ? Math.min(maxAmount, prev + 500)
                    : prev + 500,
                )
              }
              disabled={
                (maxAmount !== undefined && amount >= maxAmount) || isPending
              }
              className="h-10 w-10 shrink-0 rounded-none"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Preset Chips */}
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
                {p.label.startsWith("+") || p.label.includes("%")
                  ? p.label
                  : `${p.label}`}
                {p.label.includes("%") || p.label === "MAX"
                  ? ` (₹${p.value.toLocaleString("en-IN")})`
                  : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Middle Content Slot (e.g. Balance banner or Destination info) */}
        {children}

        {/* Error Feedback */}
        {error && (
          <div className="rounded-none bg-destructive/15 p-3 text-xs text-destructive border border-destructive/30 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={onErrorReset}
              className="underline text-[11px] font-medium ml-2 shrink-0"
            >
              Reset Key
            </button>
          </div>
        )}

        {/* Action Button */}
        <Button
          type="submit"
          disabled={
            isPending ||
            amount <= 0 ||
            (maxAmount !== undefined && amount > maxAmount)
          }
          className="w-full h-11 font-medium text-sm rounded-none"
        >
          {isPending ? (
            <>
              <RotateCw className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {error
                ? "Try Again"
                : `${submitButtonText} ₹${amount.toLocaleString("en-IN")}`}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
