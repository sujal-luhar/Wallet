// apps/merchant-app/app/api/transaction/status/route.ts
import { NextResponse } from "next/server";
import { db } from "@wallet/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@wallet/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const txId = searchParams.get("txId");

  if (!txId) {
    return NextResponse.json({ error: "Missing txId" }, { status: 400 });
  }

  const tx = await db.transaction.findUnique({
    where: { id: txId },
  });

  if (!tx) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    status: tx.status, // "PROCESSING" | "SUCCESS" | "FAILED"
    type: tx.type,
    amount: Number(tx.amount) / 100,
  });
}
