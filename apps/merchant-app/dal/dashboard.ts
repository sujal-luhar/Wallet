import { db } from "@wallet/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@wallet/auth";

// Helper to get consistent YYYY-MM-DD local date strings
function getLocalDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getMerchantDashboardData() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const merchantProfile = await db.merchantProfile.findUnique({
    where: { userId: session.user.id },
    include: { Wallet: true },
  });

  if (!merchantProfile || !merchantProfile.Wallet) {
    throw new Error("Merchant profile or wallet not found");
  }

  const walletId = merchantProfile.Wallet.id;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Fetch recent payments and weekly transactions concurrently
  const [recentSales, weeklyTransactions] = await Promise.all([
    db.transaction.findMany({
      where: {
        destinationWalletId: walletId,
        type: "MERCHANT_PAYMENT",
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.transaction.findMany({
      where: {
        destinationWalletId: walletId,
        type: "MERCHANT_PAYMENT",
        status: "SUCCESS",
        createdAt: { gte: sevenDaysAgo },
      },
      select: { amount: true, createdAt: true },
    }),
  ]);

  // Aggregate weekly total sales
  const weeklyTotalCents = weeklyTransactions.reduce(
    (acc, curr) => acc + curr.amount,
    BigInt(0),
  );

  // Group daily revenue for time-series chart using local date keys
  const dailyMap = new Map<string, bigint>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap.set(getLocalDateKey(d), BigInt(0));
  }

  weeklyTransactions.forEach((tx) => {
    const dateStr = getLocalDateKey(new Date(tx.createdAt));
    if (dailyMap.has(dateStr)) {
      dailyMap.set(dateStr, dailyMap.get(dateStr)! + tx.amount);
    }
  });

  const dailyRevenueGraph = Array.from(dailyMap.entries()).map(
    ([dateStr, amount]) => {
      const [y, m, d] = dateStr.split("-").map(Number);
      const localDate = new Date(y!, m! - 1, d!);
      return {
        date: localDate.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        }), // e.g. "Oct 13"
        revenue: Number(amount) / 100,
      };
    },
  );

  return {
    businessName: merchantProfile.businessName,
    availableBalance: Number(merchantProfile.Wallet.balance) / 100,
    lockedBalance: Number(merchantProfile.Wallet.locked) / 100,
    weeklyTotalSales: Number(weeklyTotalCents) / 100,
    dailyRevenueGraph,
    recentSales: recentSales.map((s) => ({
      id: s.id,
      amount: Number(s.amount) / 100,
      status: s.status,
      createdAt: s.createdAt,
    })),
  };
}
