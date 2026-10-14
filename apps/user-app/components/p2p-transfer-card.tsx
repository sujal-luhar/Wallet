"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, CheckCircle2, Plus, Loader2, AlertCircle, Wallet, User, Building2 } from "lucide-react";
import { Button } from "@wallet/ui/components/ui/button";
import { Input } from "@wallet/ui/components/ui/input";
import { Label } from "@wallet/ui/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@wallet/ui/components/ui/tabs";
import { initP2PTransferAction } from "@/app/actions/initP2PTransferAction";
import { initMerchantPaymentAction } from "@/app/actions/initMerchantPaymentAction";
// Optional: import { initMerchantPaymentAction } from "@/app/actions/initMerchantPaymentAction";

type RecentPayee = {
  id: string;
  name: string;
  phone: string;
};

interface P2PTransferCardProps {
  recentPayees: RecentPayee[];
  balance: number;
}

export default function P2PTransferCard({ recentPayees = [], balance = 0 }: P2PTransferCardProps) {
  const router = useRouter();
  const [transferType, setTransferType] = useState<"p2p" | "merchant">("p2p");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [merchantId, setMerchantId] = useState("");
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
      const idempotencyKey = `tx_${crypto.randomUUID()}`;

      if (transferType === "p2p") {
        const res = await initP2PTransferAction({
          recipientPhone,
          amount,
          idempotencyKey,
        });
        router.push(`/payment-success?txId=${res.id}`);
      } else {
        const res = await initMerchantPaymentAction({
          merchantId,
          amount,
          idempotencyKey,
        });
        router.push(`/payment-success?txId=${res.id}`);
      }
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
      {/* Title & Description */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Send Money</h2>
        <p className="text-xs text-muted-foreground">
          Transfer funds instantly to friends or registered businesses.
        </p>
      </div>

      {/* Production Grade Line Tabs Placement */}
      <Tabs
        defaultValue="p2p"
        value={transferType}
        onValueChange={(val) => {
          setTransferType(val as "p2p" | "merchant");
          setError(null);
        }}
        className="w-full"
      >
        <TabsList variant="line" className="w-full grid grid-cols-2">
          <TabsTrigger value="p2p" className="gap-2 text-xs">
            <User className="w-3.5 h-3.5" />
            Personal (P2P)
          </TabsTrigger>
          <TabsTrigger value="merchant" className="gap-2 text-xs">
            <Building2 className="w-3.5 h-3.5" />
            Merchant / Business
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 rounded-none">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recent Payees Row (Shown for Personal Transfers) */}
      {transferType === "p2p" && recentPayees.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Payees
          </Label>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={handleClearContact}
              className={`flex flex-col items-center justify-center p-2 min-w-[72px] h-20 border rounded-none transition-all ${selectedContactId === null
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50"
                }`}
            >
              <div className="w-10 h-10 bg-muted flex items-center justify-center text-foreground font-bold">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium mt-1 truncate w-14 text-center">New</span>
            </button>

            {recentPayees.map((payee) => (
              <button
                key={payee.id}
                type="button"
                onClick={() => handleSelectContact(payee)}
                className={`flex flex-col items-center justify-center p-2 min-w-[72px] h-20 border rounded-none transition-all ${selectedContactId === payee.id
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
        {transferType === "p2p" ? (
          /* Personal Recipient Field */
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
        ) : (
          /* Merchant ID Field */
          <div className="space-y-2">
            <Label htmlFor="merchant" className="text-xs font-medium">
              Merchant / Business ID
            </Label>
            <Input
              id="merchant"
              type="text"
              placeholder="e.g. m_acme_store or phone"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              className="h-11 rounded-none font-mono"
              required
            />
          </div>
        )}

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
          disabled={
            isSubmitting ||
            (transferType === "p2p" ? recipientPhone.length < 10 : !merchantId) ||
            amount < 1 ||
            amount > balance
          }
          className="w-full h-12 rounded-none font-semibold text-sm gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              Pay {transferType === "merchant" ? "Business" : "Friend"} ₹
              {amount ? amount.toLocaleString("en-IN") : 0}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}