import { getRecentPayees } from "@/dal/tx.p2p-payees.dal";
import { getWalletBalance } from "@/dal/user.balance.dal";
import P2PTransferCard from "@/components/p2p-transfer-card";

export default async function P2PTransferPage() {
  const [recentPayees, wallet] = await Promise.all([
    getRecentPayees(),
    getWalletBalance(),
  ]);

  const balanceInRupees = wallet ? Number(wallet.balance) / 100 : 0;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <P2PTransferCard recentPayees={recentPayees} balance={balanceInRupees} />
    </div>
  );
}
