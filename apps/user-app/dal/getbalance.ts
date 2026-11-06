import { authOptions } from "@wallet/auth";
import { db } from "@wallet/db";
import { getServerSession } from "next-auth";

async function getAuthUserId() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Unauthorised User");
  }

  return session.user.id;
}


export async function getWalletBalance() {

  const userId = await getAuthUserId();

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
