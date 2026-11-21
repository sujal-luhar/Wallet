import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL is missing! Run `node scripts/setup.mjs` or copy .env.example to .env in this app and in packages/db.",
  );
}

// prisma:// and prisma+postgres:// URLs go through Prisma Accelerate (production).
// Any plain postgres:// URL (local Docker, Neon direct, etc.) uses the pg driver adapter.
const usesAccelerate =
  url.startsWith("prisma://") || url.startsWith("prisma+postgres://");

const createClient = (): PrismaClient => {
  if (usesAccelerate) {
    return new PrismaClient({ accelerateUrl: url }).$extends(
      withAccelerate(),
    ) as unknown as PrismaClient;
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });
};

const globalForPrisma = globalThis as unknown as {
  prismaGlobal: PrismaClient | undefined;
};

export const db = globalForPrisma.prismaGlobal ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaGlobal = db;
}

export { Prisma } from "@prisma/client";
export { TxnStatus, TxnType } from "@prisma/client";
