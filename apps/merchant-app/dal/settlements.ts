import { db } from "@wallet/db";
import getMerchantProfile from "./get-merchant-profile";

interface PaginationParams {
  page?: number;
  limit?: number;
}

export async function getPaginatedMerchantSettlements({
  page = 1,
  limit = 10,
}: PaginationParams) {
  const merchantProfile = await getMerchantProfile();

  if (!merchantProfile?.Wallet) {
    return { settlements: [], totalCount: 0, totalPages: 1, currentPage: 1 };
  }

  const walletId = merchantProfile.Wallet.id;
  const skip = (page - 1) * limit;

  const [settlements, totalCount] = await Promise.all([
    db.transaction.findMany({
      where: {
        sourceWalletId: walletId,
        destinationWalletId: null, // Null destination means going to an external bank
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.transaction.count({
      where: {
        sourceWalletId: walletId,
        destinationWalletId: null,
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const formattedSettlements = settlements.map((stl) => ({
    id: stl.id,
    shortId: `#stl_${stl.id.slice(-6)}`,
    amount: Number(stl.amount) / 100,
    date: new Date(stl.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: stl.status,
  }));

  return {
    settlements: formattedSettlements,
    totalCount,
    totalPages,
    currentPage: page,
  };
}
