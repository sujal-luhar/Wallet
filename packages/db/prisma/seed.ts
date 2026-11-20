import "dotenv/config";
import bcrypt from "bcrypt";
import { db, TxnStatus, TxnType } from "../src/index.js";

const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

async function main() {
  console.log("Seeding wallet database...");

  // Delete in dependency order so foreign keys and RESTRICT constraints are satisfied
  await db.transaction.deleteMany();
  await db.wallet.deleteMany();
  await db.merchantProfile.deleteMany();
  await db.account.deleteMany();
  await db.verificationToken.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash("Admin1", 10);

  // 1. Primary Admin User (with User Wallet + MerchantProfile + Merchant Wallet)
  const adminUser = await db.user.create({
    data: {
      name: "Admin Merchant",
      email: "admin@email.com",
      phone: "+919000000001",
      emailVerified: new Date(),
      password: passwordHash,
      Wallet: {
        create: {
          balance: 1500000n, // ₹15,000.00
          locked: 200000n,   // ₹2,000.00 locked in pending/processing flow
          currency: "INR",
        },
      },
      MerchantProfile: {
        create: {
          businessName: "Admin's Flagship Store",
          supportEmail: "support@adminstore.com",
          Wallet: {
            create: {
              balance: 4250000n, // ₹42,500.00 merchant balance
              locked: 50000n,    // ₹500.00 locked
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

  // 2. Onboarding Test Account (no MerchantProfile so user can create one)
  const newAdminUser = await db.user.create({
    data: {
      name: "New Merchant Tester",
      email: "admin-new@gmail.com",
      phone: "+919000000002",
      emailVerified: new Date(),
      password: passwordHash,
      Wallet: {
        create: {
          balance: 750000n, // ₹7,500.00
          locked: 0n,
          currency: "INR",
        },
      },
    },
    include: { Wallet: true },
  });

  // 3. Counterparty Customer User (for past-week merchant payments & P2P transfers)
  const customerUser = await db.user.create({
    data: {
      name: "Rohan Patel",
      email: "customer@example.com",
      phone: "+919000000003",
      emailVerified: new Date(),
      password: passwordHash,
      Wallet: {
        create: {
          balance: 2000000n, // ₹20,000.00
          locked: 0n,
          currency: "INR",
        },
      },
    },
    include: { Wallet: true },
  });

  const adminWallet = adminUser.Wallet!;
  const merchantWallet = adminUser.MerchantProfile!.Wallet!;
  const newUserWallet = newAdminUser.Wallet!;
  const customerWallet = customerUser.Wallet!;

  // Transactions covering TxnType (DEPOSIT, WITHDRAWAL, P2P_TRANSFER, MERCHANT_PAYMENT, REFUND)
  // and TxnStatus (PENDING, PROCESSING, SUCCESS, FAILED, REFUNDED)
  await db.transaction.createMany({
    data: [
      // --- Bank Deposits (destinationWalletId only) ---
      {
        amount: 1000000n, // ₹10,000.00
        type: TxnType.DEPOSIT,
        status: TxnStatus.SUCCESS,
        destinationWalletId: adminWallet.id,
        idempotencyKey: "seed_deposit_admin_success_1",
        externalReferenceId: "EXT_DEP_SUCCESS_1001",
        createdAt: daysAgo(6),
      },
      {
        amount: 250000n, // ₹2,500.00
        type: TxnType.DEPOSIT,
        status: TxnStatus.PENDING,
        destinationWalletId: adminWallet.id,
        idempotencyKey: "seed_deposit_admin_pending_1",
        externalReferenceId: "EXT_DEP_PENDING_1002",
        createdAt: daysAgo(2),
      },
      {
        amount: 300000n, // ₹3,000.00
        type: TxnType.DEPOSIT,
        status: TxnStatus.PROCESSING,
        destinationWalletId: adminWallet.id,
        idempotencyKey: "seed_deposit_admin_processing_1",
        externalReferenceId: "EXT_DEP_PROCESSING_1003",
        createdAt: daysAgo(1),
      },
      {
        amount: 500000n, // ₹5,000.00
        type: TxnType.DEPOSIT,
        status: TxnStatus.FAILED,
        destinationWalletId: adminWallet.id,
        idempotencyKey: "seed_deposit_admin_failed_1",
        externalReferenceId: "EXT_DEP_FAILED_1004",
        failureReason: "Bank gateway timeout",
        createdAt: daysAgo(4),
      },

      // --- Bank Withdrawals (sourceWalletId only) ---
      {
        amount: 400000n, // ₹4,000.00
        type: TxnType.WITHDRAWAL,
        status: TxnStatus.SUCCESS,
        sourceWalletId: adminWallet.id,
        idempotencyKey: "seed_withdraw_admin_success_1",
        externalReferenceId: "EXT_WDR_SUCCESS_2001",
        createdAt: daysAgo(5),
      },
      {
        amount: 150000n, // ₹1,500.00
        type: TxnType.WITHDRAWAL,
        status: TxnStatus.PENDING,
        sourceWalletId: adminWallet.id,
        idempotencyKey: "seed_withdraw_admin_pending_1",
        externalReferenceId: "EXT_WDR_PENDING_2002",
        createdAt: daysAgo(1),
      },
      {
        amount: 200000n, // ₹2,000.00
        type: TxnType.WITHDRAWAL,
        status: TxnStatus.PROCESSING,
        sourceWalletId: adminWallet.id,
        idempotencyKey: "seed_withdraw_admin_processing_1",
        externalReferenceId: "EXT_WDR_PROCESSING_2003",
        createdAt: daysAgo(1),
      },
      {
        amount: 99999900n,
        type: TxnType.WITHDRAWAL,
        status: TxnStatus.FAILED,
        sourceWalletId: adminWallet.id,
        idempotencyKey: "seed_withdraw_admin_failed_1",
        externalReferenceId: "EXT_WDR_FAILED_2004",
        failureReason: "Insufficient available balance",
        createdAt: daysAgo(3),
      },

      // --- P2P Transfers (distinct sourceWalletId & destinationWalletId) ---
      {
        amount: 120000n, // ₹1,200.00
        type: TxnType.P2P_TRANSFER,
        status: TxnStatus.SUCCESS,
        sourceWalletId: customerWallet.id,
        destinationWalletId: adminWallet.id,
        idempotencyKey: "seed_p2p_customer_to_admin_success_1",
        createdAt: daysAgo(5),
      },
      {
        amount: 80000n, // ₹800.00
        type: TxnType.P2P_TRANSFER,
        status: TxnStatus.PENDING,
        sourceWalletId: adminWallet.id,
        destinationWalletId: newUserWallet.id,
        idempotencyKey: "seed_p2p_admin_to_new_pending_1",
        createdAt: daysAgo(2),
      },
      {
        amount: 60000n, // ₹600.00
        type: TxnType.P2P_TRANSFER,
        status: TxnStatus.PROCESSING,
        sourceWalletId: adminWallet.id,
        destinationWalletId: customerWallet.id,
        idempotencyKey: "seed_p2p_admin_to_customer_processing_1",
        createdAt: daysAgo(1),
      },
      {
        amount: 50000n, // ₹500.00
        type: TxnType.P2P_TRANSFER,
        status: TxnStatus.FAILED,
        sourceWalletId: adminWallet.id,
        destinationWalletId: customerWallet.id,
        idempotencyKey: "seed_p2p_admin_to_customer_failed_1",
        failureReason: "Recipient account temporarily restricted",
        createdAt: daysAgo(3),
      },

      // --- Merchant Payments (past week, received payment, and refunded payment + refund tx) ---
      {
        amount: 175000n, // ₹1,750.00 kept payment from customer in past week
        type: TxnType.MERCHANT_PAYMENT,
        status: TxnStatus.SUCCESS,
        sourceWalletId: customerWallet.id,
        destinationWalletId: merchantWallet.id,
        idempotencyKey: "seed_merchant_pay_kept_success_1",
        createdAt: daysAgo(4),
      },
      {
        amount: 95000n, // ₹950.00 payment from customer that was refunded
        type: TxnType.MERCHANT_PAYMENT,
        status: TxnStatus.REFUNDED,
        sourceWalletId: customerWallet.id,
        destinationWalletId: merchantWallet.id,
        idempotencyKey: "seed_merchant_pay_refunded_1",
        createdAt: daysAgo(3),
      },
      {
        amount: 95000n, // ₹950.00 refund sent back from merchant wallet to customer wallet
        type: TxnType.REFUND,
        status: TxnStatus.SUCCESS,
        sourceWalletId: merchantWallet.id,
        destinationWalletId: customerWallet.id,
        idempotencyKey: "seed_merchant_refund_success_1",
        createdAt: daysAgo(2),
      },
      {
        amount: 125000n, // ₹1,250.00 pending merchant payment
        type: TxnType.MERCHANT_PAYMENT,
        status: TxnStatus.PENDING,
        sourceWalletId: customerWallet.id,
        destinationWalletId: merchantWallet.id,
        idempotencyKey: "seed_merchant_pay_pending_1",
        createdAt: daysAgo(1),
      },
      {
        amount: 65000n, // ₹650.00 failed merchant payment
        type: TxnType.MERCHANT_PAYMENT,
        status: TxnStatus.FAILED,
        sourceWalletId: customerWallet.id,
        destinationWalletId: merchantWallet.id,
        idempotencyKey: "seed_merchant_pay_failed_1",
        failureReason: "Payment authorization declined",
        createdAt: daysAgo(2),
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Credentials (password for all): Admin1");
  console.log("  - admin@email.com (has wallet + merchant profile + full txn history)");
  console.log("  - admin-new@gmail.com (ready for merchant onboarding)");
  console.log("  - customer@example.com (counterparty user)");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });