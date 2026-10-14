import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { db } from "@wallet/db";

const app = express();
const PORT = 3001;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
];

const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Blocked by CORS: Origin not allowed'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.get('/mock-bank/pay', async (req, res) => {
    const rawTxId = req.query.txnId;

    if (!rawTxId) {
        return res.status(400).send("Transaction ID missing from request.");
    }

    const txnId = String(rawTxId);

    const transaction = await db.transaction.findUnique({
        where: {
            id: String(txnId)
        },
        select: {
            amount: true,
            type: true
        }
    });

    if (!transaction) {
        return res.render('pay', {
            txId: String(txnId),
            amount: 0,
            type: "--",
            error: 'Transaction not found or expired.'
        });
    }


    const formattedNumber = Number(transaction?.amount) / 100
    const formattedType = String(transaction?.type)

    res.render('pay', {
        txId: String(txnId),
        amount: formattedNumber,
        type: formattedType,
        error: null
    });
});

app.post('/mock-bank/payout', async (req, res) => {
  const { txId, amount, destinationAccount } = req.body;

  if (!txId || !amount) {
    return res.status(400).json({ success: false, error: "Invalid payload" });
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
            where: { id: txId },
            data: { status: "SUCCESS" },
          });

          await tx.wallet.update({
            where: { id: transaction.sourceWalletId! },
            data: { locked: { decrement: transaction.amount } },
          });
        });
        console.log(`[MockBank] Payout ${txId} of ₹${amount / 100} SUCCESSFUL. Cleared from locked.`);
      } else {
        // FAILED: Refund back to available balance and remove from locked
        await db.$transaction(async (tx) => {
          const transaction = await tx.transaction.update({
            where: { id: txId },
            data: { status: "FAILED" },
          });

          await tx.wallet.update({
            where: { id: transaction.sourceWalletId! },
            data: {
              balance: { increment: transaction.amount },
              locked: { decrement: transaction.amount },
            },
          });
        });
        console.log(`[MockBank] Payout ${txId} FAILED. Reverted balance to wallet and cleared locked.`);
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
});

app.post('/mock-bank/process', async (req, res) => {
  const { txId, amount, type, pin, action } = req.body;

  if (action === 'SUCCESS' && pin !== '1234') {
    return res.render('pay', { txId, amount, type, error: 'Invalid UPI PIN! Use 1234.' });
  }

  if (action === 'SUCCESS') {
    // 1. Redirect client immediately to the loading page
    const redirectUrl = `http://localhost:3002/payment-success?txId=${txId}`;
    res.redirect(redirectUrl);

    // 2. Simulate 3-second bank processing delay before updating DB
    setTimeout(async () => {
      try {
        const tx = await db.transaction.findUnique({ where: { id: txId } });

        // Ensure transaction exists and hasn't been processed already
        if (tx && tx.status === 'PENDING' && tx.destinationWalletId) {
          // Atomic update: Mark SUCCESS + Credit Wallet
          await db.$transaction([
            db.transaction.update({
              where: { id: txId },
              data: { status: 'SUCCESS' },
            }),
            db.wallet.update({
              where: { id: tx.destinationWalletId! },
              data: {
                balance: { increment: tx.amount },
              },
            }),
          ]);
          console.log(`[MockBank] Transaction ${txId} successfully completed!`);
        }
      } catch (err) {
        console.error(`[MockBank] Error updating transaction ${txId}:`, err);
      }
    }, 3000);

  } else {
    // Handle Failed Payment
    await db.transaction.update({
      where: { id: String(txId) },
      data: { status: 'FAILED' },
    });

    const redirectUrl = `http://localhost:3002/payment-success?txId=${txId}`;
    res.redirect(redirectUrl);
  }
});

app.get('/', (req, res) => {
    res.send('CORS enabled for multiple domains!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});