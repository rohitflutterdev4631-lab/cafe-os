import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const NEON_FALLBACK =
  'postgresql://neondb_owner:npg_NUCpdnjkW0R2@ep-little-glitter-bb3qcw9r-pooler.c-15.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

function getDatabaseUrl(): string | undefined {
  const isVercel = !!process.env.VERCEL;
  const envUrl = process.env.DATABASE_URL;

  // If running on Vercel and DATABASE_URL was mistakenly configured with localhost
  if (isVercel && envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
    return (
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL_UNPOOLED ||
      process.env.STORAGE_DATABASE_URL ||
      NEON_FALLBACK
    );
  }

  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.STORAGE_DATABASE_URL ||
    process.env.STORAGE_POSTGRES_URL ||
    (isVercel ? NEON_FALLBACK : undefined)
  );
}

const activeDbUrl = getDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: activeDbUrl
      ? {
          db: {
            url: activeDbUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

globalForPrisma.prisma = prisma;
