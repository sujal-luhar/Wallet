import BalanceCard from "@/components/balance-card";
import FundsTabs from "@/components/funds-tabs";
import { getWalletBalance } from "@/dal/user.balance.dal";

export default async function FundsPage() {
  const wallet = await getWalletBalance();
  const numericBalance = wallet?.balance ? Number(wallet.balance) / 100 : 0;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {/* Server-fetched Balance */}
      <BalanceCard
        formattedBalance={wallet?.formattedBalance}
        currency={wallet?.currency}
      />

      {/* Client-side Instant Tab Switcher */}
      <FundsTabs balance={numericBalance} />
    </div>
  );
}
