import crypto from "crypto";
import { db } from "@wallet/db"; // adjust named export if your package exports { db } or { prisma }

export const generateVerificationToken = async (email: string) => {
  // 1. Generate a secure random 64-character hexadecimal token (32 bytes)
  const token = crypto.randomBytes(32).toString("hex");

  // 2. Set token expiration to 24 hours from current time
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // 3. Delete any previous unverified tokens existing for this email address
  const existingToken = await db.verificationToken.findFirst({
    where: { identifier: email },
  });

  if (existingToken) {
    await db.verificationToken.delete({
      where: {
        token: existingToken.token,
      },
    });
  }

  // 4. Save the new token in the database
  const verificationToken = await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return verificationToken;
};
