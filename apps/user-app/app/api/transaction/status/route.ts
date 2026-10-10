import { NextRequest, NextResponse } from "next/server";
import { db } from "@wallet/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const txId = searchParams.get("txId");

  if (!txId) {
    return NextResponse.json({ error: "Missing txId" }, { status: 400 });
  }

  const transaction = await db.transaction.findUnique({
    where: { id: txId },
    select: {
      status: true,
      amount: true,
      type: true,
    },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: transaction.status,
    type: transaction.type,
    amount: Number(transaction.amount) / 100, // Format to standard currency
  });
}