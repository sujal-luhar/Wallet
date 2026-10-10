"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, CheckCircle2, Plus, Loader2, AlertCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initP2PTransferAction } from "@/app/actions/initP2PTransferAction";

type RecentPayee = {
  id: string;
  name: string;
  phone: string;
};

interface P2PTransferCardProps {
  recentPayees: RecentPayee[];
  balance: number; // 👈 Pass balance in Rupees (e.g. 1500)
}

export default function P2PTransferCard({ recentPayees = [], balance = 0 }: P2PTransferCardProps) {
  const router = useRouter();
  const [recipientPhone, setRecipientPhone] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(500);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectContact = (payee: RecentPayee) => {
    setSelectedContactId(payee.id);
    setRecipientPhone(payee.phone);
    setError(null);
  };

  const handleClearContact = () => {
    setSelectedContactId(null);
    setRecipientPhone("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount > balance) {
      setError("Insufficient wallet balance.");
      return;
    }

    setIsSubmitting(true);

    try {
      const idempotencyKey = `p2p_${crypto.randomUUID()}`;
      const res = await initP2PTransferAction({
        recipientPhone,
        amount,
        idempotencyKey,
      });

      // P2P settles immediately in DB -> redirect straight to payment success page
      router.push(`/payment-success?txId=${res.id}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to process transfer.");
      } else {
        setError("Failed to process transfer.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto border bg-card p-6 space-y-6 rounded-none shadow-sm">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">P2P Transfer</h2>
        <p className="text-xs text-muted-foreground">
          Send money instantly to any wallet using their phone number.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 rounded-none">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recent Payees Row */}
      {recentPayees.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Payees
          </Label>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {/* New Transfer Tile */}
            <button
              type="button"
              onClick={handleClearContact}
              className={`flex flex-col items-center justify-center p-2 min-w-[72px] h-20 border rounded-none transition-all ${
                selectedContactId === null
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50"
              }`}
            >
              <div className="w-10 h-10 bg-muted flex items-center justify-center text-foreground font-bold">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium mt-1 truncate w-14 text-center">
                New
              </span>
            </button>

            {/* Payee Tiles */}
            {recentPayees.map((payee) => (
              <button
                key={payee.id}
                type="button"
                onClick={() => handleSelectContact(payee)}
                className={`flex flex-col items-center justify-center p-2 min-w-[72px] h-20 border rounded-none transition-all ${
                  selectedContactId === payee.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground/50"
                }`}
              >
                <div className="w-10 h-10 bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                  {payee.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-[10px] font-medium mt-1 truncate w-14 text-center">
                  {payee.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Recipient Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-xs font-medium">
            Recipient Phone Number
          </Label>
          <div className="relative">
            <Input
              id="phone"
              type="tel"
              placeholder="Enter 10-digit phone number"
              value={recipientPhone}
              onChange={(e) => {
                setRecipientPhone(e.target.value);
                setSelectedContactId(null);
              }}
              className="h-11 rounded-none pr-9 font-mono"
              required
            />
            {recipientPhone.length === 10 && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-3.5" />
            )}
          </div>
        </div>

        {/* Amount Field with Balance Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="amount" className="text-xs font-medium">
              Amount (₹)
            </Label>
            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
              <Wallet className="w-3 h-3" />
              Available:{" "}
              <span className="font-bold text-foreground">
                ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </span>
          </div>

          <Input
            id="amount"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="h-11 rounded-none text-lg font-bold"
            required
          />

          {/* Preset Increments */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[100, 500, 1000, 2000].map((preset) => (
              <Button
                key={preset}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(preset)}
                className="h-8 text-xs rounded-none font-medium"
              >
                +₹{preset}
              </Button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || recipientPhone.length < 10 || amount < 1 || amount > balance}
          className="w-full h-12 rounded-none font-semibold text-sm gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send ₹{amount ? amount.toLocaleString("en-IN") : 0} Now
            </>
          )}
        </Button>
      </form>
    </div>
  );
}