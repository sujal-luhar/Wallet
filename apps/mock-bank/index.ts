import "dotenv/config";

import express from "express";
import cors from "cors";
import { db } from "@wallet/db";

const app = express();
const PORT = 3001;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  ...[
    process.env.USER_APP_URL,
    process.env.MERCHANT_APP_URL,
    process.env.WEB_APP_URL,
    process.env.MOCK_BANK_URL,
  ]
    .filter(Boolean)
    .map((u) => {
      try {
        return new URL(u as string).origin;
      } catch {
        return u as string;
      }
    }),
];

const USER_APP_URL = process.env.USER_APP_URL || "http://localhost:3002";

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Blocked by CORS: Origin not allowed"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

const MOCK_BANK_API_SECRET = process.env.MOCK_BANK_API_SECRET;

if (!MOCK_BANK_API_SECRET) {
  throw new Error("MOCK_BANK_API_SECRET is missing");
}

function authenticatePayout(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const authHeader = req.headers.authorization;
  const expected = `Bearer ${MOCK_BANK_API_SECRET}`;

  if (authHeader !== expected) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }

  next();
}

app.get("/mock-bank/pay", async (req, res) => {
  const txnId = req.query.txnId;

  if (!txnId) {
    return res.status(400).send("Transaction ID missing from request.");
  }

  const transaction = await db.transaction.findUnique({
    where: {
      id: String(txnId),
    },
    select: {
      amount: true,
      type: true,
    },
  });

  if (!transaction) {
    return res.render("pay", {
      txId: String(txnId),
      amount: 0,
      type: "--",
      error: "Transaction not found or expired.",
    });
  }

  const formattedNumber = Number(transaction?.amount) / 100;
  const formattedType = String(transaction?.type);

  res.render("pay", {
    txId: String(txnId),
    amount: formattedNumber,
    type: formattedType,
    error: null,
  });
});

app.post("/mock-bank/payout", authenticatePayout, async (req, res) => {
  const { txId, amount } = req.body;

  if (!txId || !amount || amount <= 0) {
    return res.status(400).json({ success: false, error: "Invalid payload" });
  }

  try {
    // Verify that this is the valid pending withdrawal

    const transaction = await db.transaction.findFirst({
      where: {
        id: txId,
        type: "WITHDRAWAL",
        status: "PENDING",
      },
      select: {
        id: true,
        amount: true,
      },
    });

    if (!transaction) {
      return res.status(409).json({
        success: false,
        error: "Transaction not found or already processed",
      });
    }

    if (transaction.amount !== BigInt(amount)) {
      return res.status(400).json({
        success: false,
        error: "Amount mismatch",
      });
    }

    // Simulate bank processing delay (2 seconds)
    setTimeout(async () => {
      try {
        // Simulate 90% success rate, 10% bank failure rate
        const isSuccessful = Math.random() < 0.9;

        if (isSuccessful) {
          // SUCCESS: Clear from locked balance permanently
          await db.$transaction(async (tx) => {
            const transaction = await tx.transaction.update({
              where: {
                id: txId,
                status: "PENDING",
                type: "WITHDRAWAL",
              },
              data: { status: "SUCCESS" },
            });

            if (!transaction) {
              console.log(`[MockBank] ${txId} already processed. Skipping.`);
              return;
            }

            if (!transaction.sourceWalletId) {
              throw new Error(`Missing source wallet for payout ${txId}`);
            }

            await tx.wallet.update({
              where: { id: transaction.sourceWalletId },
              data: { locked: { decrement: transaction.amount } },
            });
          });
          console.log(
            `[MockBank] Payout ${txId} of ₹${amount / 100} SUCCESSFUL. Cleared from locked.`,
          );
        } else {
          // FAILED: Refund back to available balance and remove from locked
          await db.$transaction(async (tx) => {
            const transaction = await tx.transaction.update({
              where: {
                id: txId,
                type: "WITHDRAWAL",
                status: "PENDING",
              },
              data: { status: "FAILED" },
            });

            if (!transaction) {
              console.log(`[MockBank] ${txId} already processed. Skipping.`);
              return;
            }

            if (!transaction.sourceWalletId) {
              throw new Error(`Missing source wallet for payout ${txId}`);
            }

            await tx.wallet.update({
              where: { id: transaction.sourceWalletId },
              data: {
                balance: { increment: transaction.amount },
                locked: { decrement: transaction.amount },
              },
            });
          });
          console.log(
            `[MockBank] Payout ${txId} FAILED. Reverted balance to wallet and cleared locked.`,
          );
        }
      } catch (err) {
        console.error(`[MockBank] Error processing payout ${txId}:`, err);
      }
    }, 2000);

    return res.status(202).json({
      success: true,
      message: "Payout request accepted and queued by bank.",
      txId,
    });
  } catch (err) {
    console.error(`[MockBank] Error accepting payout ${txId}:`, err);

    return res.status(500).json({
      success: false,
      error: "Unable to accept payout",
    });
  }
});

app.post("/mock-bank/process", async (req, res) => {
  const { txId, amount, type, pin, action } = req.body;

  if (action === "SUCCESS" && pin !== "1234") {
    return res.render("pay", {
      txId,
      amount,
      type,
      error: "Invalid UPI PIN! Use 1234.",
    });
  }

  if (action === "SUCCESS") {
    // 1. Redirect client immediately to the loading page
    const redirectUrl = `${USER_APP_URL}/payment-success?txId=${txId}`;
    res.redirect(redirectUrl);

    // 2. Simulate 3-second bank processing delay before updating DB
    setTimeout(async () => {
      try {
        // Solved check-then-act race
        const credited = await db.$transaction(async (prisma) => {
          const { count } = await prisma.transaction.updateMany({
            where: {
              id: txId,
              status: "PENDING",
              type: "DEPOSIT",
            },
            data: { status: "SUCCESS" },
          });

          if (count === 0) return false; // already processed (or not a pending deposit)

          const tx = await prisma.transaction.findUniqueOrThrow({
            where: { id: txId },
            select: { destinationWalletId: true, amount: true },
          });

          await prisma.wallet.update({
            where: { id: tx.destinationWalletId! },
            data: { balance: { increment: tx.amount } },
          });

          return true;
        });

        if (credited) console.log(`[MockBank] Transaction ${txId} completed`);
      } catch (err) {
        console.error(`[MockBank] Error updating transaction ${txId}:`, err);
      }
    }, 3000);
  } else {
    // Handle Failed Payment
    await db.transaction.update({
      where: {
        id: txId,
        status: "PENDING",
        type: "DEPOSIT",
      },
      data: { status: "FAILED" },
    });

    const redirectUrl = `${USER_APP_URL}/payment-success?txId=${txId}`;
    res.redirect(redirectUrl);
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/", (req, res) => {
  res.send("CORS enabled for multiple domains!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
