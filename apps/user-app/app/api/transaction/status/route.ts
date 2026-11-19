import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@wallet/db";
import { authOptions } from "@wallet/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const txId = req.nextUrl.searchParams.get("txId");

  if (!txId) {
    return NextResponse.json({ error: "Missing txId" }, { status: 400 });
  }

  // Querying with `session.user.*` to solve
  // IDOR (Insecure Direct Object Reference)
  const transaction = await db.transaction.findFirst({
    where: {
      id: txId,
      OR: [
        // The OR covers every transaction type: Deposit, Withdrawal, P2P
        { sourceWallet: { userId: session.user.id } },
        { destinationWallet: { userId: session.user.id } },
      ],
    },
    select: {
      status: true,
      amount: true,
      type: true,
    },
  });

  // Same 404 for "doesn't exist" and "belongs to someone else",
  // so attackers can't tell which txIds are real
  if (!transaction) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    status: transaction.status,
    type: transaction.type,
    amount: Number(transaction.amount) / 100,
  });
}
