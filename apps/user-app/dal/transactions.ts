import { getWalletBalance } from "@/dal/dashboard";
import { db } from "@wallet/db";

// -----------------------------------------------------------------------------
// 1. Private query helper to automatically derive Prisma's complex type
// -----------------------------------------------------------------------------
async function fetchRawTransactions(walletId: string, skip: number, take: number) {
  return db.transaction.findMany({
    where: {
      OR: [
        { sourceWalletId: walletId },
        { destinationWalletId: walletId },
      ],
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
    include: {
      sourceWallet: {
        include: { user: { select: { phone: true, name: true } } },
      },
      destinationWallet: {
        include: { user: { select: { phone: true, name: true } } },
      },
    },
  });
}

// 🎯 AUTOMATIC TYPE INFERENCE: Extracts array item type from fetchRawTransactions
type RawTransactionItem = Awaited<ReturnType<typeof fetchRawTransactions>>[number];

// -----------------------------------------------------------------------------
// 2. Formatter Function (Now 100% strictly typed without 'any')
// -----------------------------------------------------------------------------
function formatTransactionRecord(tx: RawTransactionItem, currentWalletId: string) {
  const isSender = tx.sourceWalletId === currentWalletId;

  // Format amount from Paise to Rupees
  const formattedValue = (Number(tx.amount) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let title = "Transaction";
  let amountSign = "";

  if (tx.type === "DEPOSIT") {
    title = "Bank Deposit";
    amountSign = "+";
  } else if (tx.type === "WITHDRAWAL") {
    title = "Bank Withdrawal";
    amountSign = "-";
  } else if (tx.type === "P2P_TRANSFER") {
    if (isSender) {
      const recipientPhone = tx.destinationWallet?.user?.phone ?? "User";
      title = `Transfer to ${recipientPhone}`;
      amountSign = "-";
    } else {
      const senderPhone = tx.sourceWallet?.user?.phone ?? "User";
      title = `Received from ${senderPhone}`;
      amountSign = "+";
    }
  }

  return {
    id: tx.id,
    title,
    amount: `${amountSign}₹${formattedValue}`,
    isSender,
    status: tx.status,
    date: new Date(tx.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  };
}

// -----------------------------------------------------------------------------
// 3. Paginated Transactions Query
// -----------------------------------------------------------------------------
interface GetTransactionsParams {
  page?: number;
  limit?: number;
}

export async function getPaginatedTransactions({ page = 1, limit = 10 }: GetTransactionsParams = {}) {
  const wallet = await getWalletBalance();
  const walletId = wallet?.id;

  // Guarding walletId guarantees it's a string before querying
  if (!walletId) {
    return { transactions: [], totalCount: 0, totalPages: 1, currentPage: 1, limit };
  }

  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const skip = (safePage - 1) * safeLimit;

  const [rawTransactions, totalCount] = await Promise.all([
    fetchRawTransactions(walletId, skip, safeLimit),
    db.transaction.count({
      where: {
        OR: [
          { sourceWalletId: walletId },
          { destinationWalletId: walletId },
        ],
      },
    }),
  ]);

  const transactions = rawTransactions.map((tx) => formatTransactionRecord(tx, walletId));
  const totalPages = Math.ceil(totalCount / safeLimit) || 1;

  return {
    transactions,
    totalCount,
    totalPages,
    currentPage: safePage,
    limit: safeLimit,
  };
}

// -----------------------------------------------------------------------------
// 4. Dashboard Wrapper
// -----------------------------------------------------------------------------
export async function getRecentTransactions(walletId?: string, limit = 5) {
  const { transactions } = await getPaginatedTransactions({ page: 1, limit });
  return transactions;
}