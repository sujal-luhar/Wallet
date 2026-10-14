import { authOptions } from "@wallet/auth";
import { db } from "@wallet/db";
import { getServerSession } from "next-auth";
import { getRecentTransactions } from "./transactions";

async function getAuthUserId() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        throw new Error("Unauthorised User");
    }

    return session.user.id;
}

export async function getWalletBalance() {
    // =========================================================================
    // 1. DATA FETCHING REFERENCE: Current Wallet Balance
    // =========================================================================

    const userId = await getAuthUserId()

    const wallet = await db.wallet.findUnique({
        where: {
            userId: userId,
        },
        select: {
            id: true,
            balance: true,
            locked: true,
            currency: true,
        },
    });

    // Balance is stored as BigInt in Paise/Cents (e.g. 1245075 = ₹12,450.75)
    const rawBalance = wallet?.balance ?? BigInt(0);
    const formattedBalance = (Number(rawBalance) / 100).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return { ...wallet, formattedBalance };
}

export async function getRecentTransactions2(walletId: string | undefined, limit = 5) {
    // =========================================================================
    // TODO [YOUR PRACTICE 1]: Fetch Recent Transactions
    // Write a Prisma query to get the last 5 transactions where sourceWalletId
    // or destinationWalletId equals `walletId`.
    //
    // Example Target:
    // const recentTransactions = await db.transaction.findMany({ ... })
    // =========================================================================

    if (!walletId) return [];

    // 2. Fetch the 5 most recent transactions for this wallet
    const rawTransactions = await db.transaction.findMany({
        where: {
            OR: [
                { sourceWalletId: walletId },
                { destinationWalletId: walletId },
            ],
        },
        orderBy: {
            createdAt: "desc",
        },
        take: limit,
        include: {
            sourceWallet: {
                include: {
                    user: { select: { phone: true, name: true } },
                },
            },
            destinationWallet: {
                include: {
                    user: { select: { phone: true, name: true } },
                },
            },
        },
    });

    // 3. Transform raw DB rows into formatted UI display objects
    const recentTransactions = rawTransactions.map((tx) => {
        const isSender = tx.sourceWalletId === walletId;

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
    });

    return recentTransactions;
}

export async function getMonthlyTransactionStats(walletId: string | undefined) {
    // =========================================================================
    // TODO [YOUR PRACTICE 3]: Fetch Monthly Statistics
    // Write an aggregation query (or calculate from transactions) to get total
    // money received and total money sent in the current calendar month.
    // =========================================================================

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
        amount === null ?
            "0.00" :
            (Number(amount) / 100).toLocaleString("en-IN", {
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
                status: "SUCCESS"
            },
            _sum: {
                amount: true,
            }
        }),
        db.transaction.aggregate({
            where: {
                sourceWalletId: walletId,
                createdAt: {
                    gte: startOfMonth,
                    lt: startOfNextMonth, // safer than lte to capture everything right before next month
                },
                status: "SUCCESS"
            },
            _sum: {
                amount: true,
            }
        })
    ])

    return {
        monthlyReceived: `₹${formattedValue(monthlyReceivedAggregate._sum.amount)}`,
        monthlySent: `₹${formattedValue(monthlySentAggregate._sum.amount)}`,
    }
}

export default async function getDashboardData() {
    const wallet = await getWalletBalance();

    const [recentTransactions, monthlyStats] = await Promise.all([
        getRecentTransactions(wallet.id),
        getMonthlyTransactionStats(wallet.id)
    ])

    return {
        wallet,
        recentTransactions,
        monthlyStats,
    }
}