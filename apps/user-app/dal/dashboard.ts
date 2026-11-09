import { db } from "@wallet/db";
import { getRecentTransactions } from "./transactions";
import { getWalletBalance } from "./getbalance";

async function getMonthlyTransactionStats(walletId: string | undefined) {
  if (!walletId) {
    return {
      monthlyReceived: "₹0.00",
      monthlySent: "₹0.00",
    };
  }

  const date = new Date();

  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const startOfNextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

  const formattedValue = (amount: bigint | null) =>
    amount === null
      ? "0.00"
      : (Number(amount) / 100).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  // const monthlyReceivedAggregate = await db.transaction.aggregate({
  //     where: {
  //         destinationWalletId: walletId,
  //         createdAt: {
  //             gte: startOfMonth,
  //             lt: startOfNextMonth, // safer than lte to capture everything right before next month
  //         },
  //         status: "SUCCESS"
  //     },
  //     _sum: {
  //         amount: true,
  //     }
  // })

  // const monthlySentAggregate = await db.transaction.aggregate({
  //     where: {
  //         sourceWalletId: walletId,
  //         createdAt: {
  //             gte: startOfMonth,
  //             lt: startOfNextMonth, // safer than lte to capture everything right before next month
  //         },
  //         status: "SUCCESS"
  //     },
  //     _sum: {
  //         amount: true,
  //     }
  // })

  const [monthlyReceivedAggregate, monthlySentAggregate] = await Promise.all([
    db.transaction.aggregate({
      where: {
        destinationWalletId: walletId,
        createdAt: {
          gte: startOfMonth,
          lt: startOfNextMonth, // safer than lte to capture everything right before next month
        },
        status: "SUCCESS",
      },
      _sum: {
        amount: true,
      },
    }),
    db.transaction.aggregate({
      where: {
        sourceWalletId: walletId,
        createdAt: {
          gte: startOfMonth,
          lt: startOfNextMonth, // safer than lte to capture everything right before next month
        },
        status: "SUCCESS",
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  return {
    monthlyReceived: `₹${formattedValue(monthlyReceivedAggregate._sum.amount)}`,
    monthlySent: `₹${formattedValue(monthlySentAggregate._sum.amount)}`,
  };
}

export default async function getDashboardData() {
  const wallet = await getWalletBalance();

  const [recentTransactions, monthlyStats] = await Promise.all([
    getRecentTransactions(wallet.id),
    getMonthlyTransactionStats(wallet.id),
  ]);

  return {
    wallet,
    recentTransactions,
    monthlyStats,
  };
}
