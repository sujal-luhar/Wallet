import { db } from "@wallet/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@wallet/auth";

export default async function getMerchantProfile() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const merchantProfile = await db.merchantProfile.findUnique({
    where: { userId: session.user.id },
    include: { Wallet: true },
  });

  return merchantProfile;
}
