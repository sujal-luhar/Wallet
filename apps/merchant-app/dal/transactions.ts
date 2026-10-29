import { db } from "@wallet/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@wallet/auth";

interface PaginationParams {
  page?: number;
  limit?: number;
}

export async function getPaginatedMerchantTransactions({
  page = 1,
  limit = 10,
}: PaginationParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const merchantProfile = await db.merchantProfile.findUnique({
    where: { userId: session.user.id },
    include: { Wallet: true },
  });

  if (!merchantProfile?.Wallet) {
    return { transactions: [], totalCount: 0, totalPages: 1, currentPage: 1 };
  }

  const walletId = merchantProfile.Wallet.id;
  const skip = (page - 1) * limit;

  const [transactions, totalCount] = await Promise.all([
    db.transaction.findMany({
      where: {
        destinationWalletId: walletId,
        type: "MERCHANT_PAYMENT",
      },
      include: {
        sourceWallet: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.transaction.count({
      where: {
        destinationWalletId: walletId,
        type: "MERCHANT_PAYMENT",
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const formattedTransactions = transactions.map((tx) => ({
    id: tx.id,
    shortId: `#tx_${tx.id.slice(-6)}`,
    customer: tx.sourceWallet?.user?.name || "Anonymous Customer",
    amount: Number(tx.amount) / 100,
    date: new Date(tx.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    status: tx.status,
  }));

  return {
    transactions: formattedTransactions,
    totalCount,
    totalPages,
    currentPage: page,
  };
}
