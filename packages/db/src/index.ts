import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL is missing! Please make sure DATABASE_URL is defined in apps/user-app/.env"
  );
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    accelerateUrl: url,
  }).$extends(withAccelerate());
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const db =
  (globalThis.prismaGlobal ?? prismaClientSingleton()) as ReturnType<
    typeof prismaClientSingleton
  >;

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = db;
}

export * from "@prisma/client";