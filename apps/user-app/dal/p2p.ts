import { getWalletBalance } from "@/dal/dashboard";
import { db } from "@wallet/db";

export async function getRecentPayees() {
  const wallet = await getWalletBalance();
  if (!wallet?.id) return [];

  // Fetch recent outgoing P2P transactions
  const recentTransactions = await db.transaction.findMany({
    where: {
      sourceWalletId: wallet.id,
      type: "P2P_TRANSFER",
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      destinationWallet: {
        include: {
          user: { select: { id: true, name: true, phone: true } },
        },
      },
    },
  });

  // Deduplicate payees by User ID
  const seenUserIds = new Set<string>();
  const recentPayees = [];

  for (const tx of recentTransactions) {
    const recipientUser = tx.destinationWallet?.user;
    if (recipientUser?.phone && !seenUserIds.has(recipientUser.id)) {
      seenUserIds.add(recipientUser.id);
      recentPayees.push({
        id: recipientUser.id,
        name: recipientUser.name || "User",
        phone: recipientUser.phone,
      });
    }
  }

  return recentPayees.slice(0, 5);
}
