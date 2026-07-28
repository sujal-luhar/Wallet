import { db } from "../src/index.js";

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Clean existing records (in reverse dependency order)
  await db.transaction.deleteMany();
  await db.wallet.deleteMany();
  await db.merchantProfile.deleteMany();
  await db.user.deleteMany();

  console.log("🧹 Cleaned old database records.");

  // 2. Create User 1: Alice (Regular User)
  const alice = await db.user.create({
    data: {
      name: "Alice Smith",
      email: "alice@example.com",
      phone: "+919876543210",
      password: "hashed_password_alice",
      Wallet: {
        create: {
          balance: BigInt(1000000), // ₹10,000.00 (stored in paise)
          currency: "INR",
        },
      },
    },
    include: { Wallet: true },
  });

  // 3. Create User 2: Bob (Regular User)
  const bob = await db.user.create({
    data: {
      name: "Bob Jones",
      email: "bob@example.com",
      phone: "+919876543211",
      password: "hashed_password_bob",
      Wallet: {
        create: {
          balance: BigInt(500000), // ₹5,000.00
          currency: "INR",
        },
      },
    },
    include: { Wallet: true },
  });

  // 4. Create User 3: Charlie (Merchant User)
  const charlie = await db.user.create({
    data: {
      name: "Charlie Brown",
      email: "charlie@electronics.com",
      phone: "+919876543212",
      password: "hashed_password_charlie",
      Wallet: {
        create: {
          balance: BigInt(100000), // ₹1,000.00 personal balance
          currency: "INR",
        },
      },
      MerchantProfile: {
        create: {
          businessName: "Charlie's Tech Store",
          supportEmail: "support@charliestech.com",
          Wallet: {
            create: {
              balance: BigInt(2500000), // ₹25,000.00 business balance
              currency: "INR",
            },
          },
        },
      },
    },
    include: {
      Wallet: true,
      MerchantProfile: {
        include: { Wallet: true },
      },
    },
  });

  console.log("👤 Created test users & wallets:");
  console.log(`   - Alice (ID: ${alice.id})`);
  console.log(`   - Bob (ID: ${bob.id})`);
  console.log(`   - Charlie Merchant (ID: ${charlie.MerchantProfile?.id})`);

  // 5. Create Sample Transactions
  if (alice.Wallet && bob.Wallet && charlie.MerchantProfile?.Wallet) {
    // Transaction A: Bank Deposit -> Alice Wallet
    await db.transaction.create({
      data: {
        amount: BigInt(1000000),
        type: "DEPOSIT",
        status: "SUCCESS",
        destinationWalletId: alice.Wallet.id,
        externalReferenceId: "HDFC_BANK_REF_998811",
      },
    });

    // Transaction B: Alice -> Bob (P2P Transfer)
    await db.transaction.create({
      data: {
        amount: BigInt(200000), // ₹2,000.00
        type: "P2P_TRANSFER",
        status: "SUCCESS",
        sourceWalletId: alice.Wallet.id,
        destinationWalletId: bob.Wallet.id,
        idempotencyKey: "p2p_txn_alice_to_bob_001",
      },
    });

    // Transaction C: Bob -> Charlie Tech Store (Merchant Payment)
    await db.transaction.create({
      data: {
        amount: BigInt(150000), // ₹1,500.00
        type: "MERCHANT_PAYMENT",
        status: "SUCCESS",
        sourceWalletId: bob.Wallet.id,
        destinationWalletId: charlie.MerchantProfile.Wallet.id,
        idempotencyKey: "merchant_pay_bob_to_charlie_001",
      },
    });

    console.log("💸 Created 3 sample transactions (Deposit, P2P, Merchant Payment).");
  }

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    // Disconnect prisma client
  });