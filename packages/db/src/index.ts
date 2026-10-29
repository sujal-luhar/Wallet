import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL is missing! Please make sure DATABASE_URL is defined in apps/user-app/.env",
  );
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    accelerateUrl: url,
  }).$extends(withAccelerate());
};

type ExtendedPrismaClient = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prismaGlobal: ExtendedPrismaClient | undefined;
};

export const db = (globalForPrisma.prismaGlobal ??
  prismaClientSingleton()) as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaGlobal = db as unknown as ExtendedPrismaClient;
}

export * from "@prisma/client";
