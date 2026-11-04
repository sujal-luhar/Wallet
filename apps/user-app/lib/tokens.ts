import crypto from "crypto";
import { db } from "@wallet/db";

export async function generateVerificationToken(email: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hrs

  // Use DeleteMany to wipe out any old tokens cleanly
  await db.$transaction(async (tx) => {
    await tx.verificationToken.deleteMany({
      where: { identifier: email },
    });

    await tx.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });
  });

  return token;
}
