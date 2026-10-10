"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@wallet/db";

export async function updatePhoneNumber(phoneNumber: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Basic validation (10 digits)
  if (!/^\d{10}$/.test(phoneNumber.slice(3))) {
    return { success: false, error: "Please enter a valid 10-digit phone number." };
  }

  // Check if number is already in use by another account
  const existingUser = await db.user.findFirst({
    where: { phone: phoneNumber },
  });

  if (existingUser) {
    return { success: false, error: "This phone number is already registered." };
  }

  // Save phone number
  await db.user.update({
    where: { id: session.user.id },
    data: { phone: phoneNumber },
  });

  return { success: true };
}