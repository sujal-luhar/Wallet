"use server";

import { sendVerificationEmail } from "@/lib/mailer";
import { generateVerificationToken } from "@/lib/tokens";
import { db } from "@wallet/db";

export async function resendVerificationTokenAction(email: string) {
  const user = await db.user.findUnique({
    where: {
      email: email,
    },
  });

  if (!user || !user.email || user.emailVerified) {
    return {
      success: true,
      message:
        "If your email is registered, a verification link has been sent.",
    };
  }

  const existingToken = await db.verificationToken.findFirst({
    where: { identifier: user.email },
    orderBy: { createdAt: "desc" }, // Get the most recent one if multiple exist
  });

  if (existingToken) {
    const timeElapsed =
      Date.now() - new Date(existingToken.createdAt).getTime();
    const cooldownMs = 60 * 1000; //60 seconds

    if (timeElapsed < cooldownMs) {
      const secondsLeft = Math.ceil((cooldownMs - timeElapsed) / 1000);
      return {
        success: false,
        message: `Please wait ${secondsLeft} seconds before requesting another email.`,
      };
    }
  }

  const token = await generateVerificationToken(user.email);
  await sendVerificationEmail(email, token);

  return {
    success: true,
    message: "Verification email sent successfully.",
  };
}
