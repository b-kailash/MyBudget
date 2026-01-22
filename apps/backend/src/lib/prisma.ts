import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client singleton instance
 * Prevents multiple instances in development with hot reload
 */

// Extend global type to include prisma
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Create a new Prisma client instance or reuse existing one
 */
export const prisma = global.prisma || new PrismaClient();

/**
 * In development, store the client on global to prevent
 * creating multiple instances due to hot reloading
 */
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
