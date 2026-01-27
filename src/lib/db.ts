import { PrismaClient } from "../../generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Create Prisma client with Accelerate extension
const createPrismaClient = () => {
  // Prisma 7 requires accelerateUrl option for Prisma Accelerate
  return new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL,
  }).$extends(withAccelerate());
};

// Create a singleton Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "../../generated/prisma/client";
