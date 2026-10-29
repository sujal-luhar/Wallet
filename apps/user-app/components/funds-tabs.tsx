"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@wallet/ui/components/ui/button";
import DepositCard from "@/components/deposit-card";
import WithdrawCard from "@/components/withdraw-card";

type FundsTabsProps = {
  balance: number;
};

export default function FundsTabs({ balance }: FundsTabsProps) {
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");

  return (
    <div className="space-y-6">
      {/* Tab Buttons */}
      <div className="grid max-w-md grid-cols-2 gap-3">
        <Button
          type="button"
          size="lg"
          variant={activeTab === "deposit" ? "default" : "outline"}
          onClick={() => setActiveTab("deposit")}
          className="w-full h-12 text-sm font-semibold rounded-none gap-2"
        >
          <ArrowDownLeft className="w-4 h-4" />
          Deposit
        </Button>

        <Button
          type="button"
          size="lg"
          variant={activeTab === "withdraw" ? "default" : "outline"}
          onClick={() => setActiveTab("withdraw")}
          className="w-full h-12 text-sm font-semibold rounded-none gap-2"
        >
          <ArrowUpRight className="w-4 h-4" />
          Withdraw
        </Button>
      </div>

      {/* Option A: Render both and toggle visibility with CSS (Preserves input state when toggling) */}
      <div className={activeTab === "deposit" ? "block" : "hidden"}>
        <DepositCard />
      </div>
      <div className={activeTab === "withdraw" ? "block" : "hidden"}>
        <WithdrawCard balance={balance} />
      </div>
    </div>
  );
}
