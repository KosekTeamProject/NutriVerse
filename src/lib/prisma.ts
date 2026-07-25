import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
  prismaAdapter?: PrismaPg;
};

let pool: Pool;
if (process.env.NODE_ENV === 'production') {
  pool = new Pool({ connectionString });
} else {
  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = new Pool({ connectionString });
  }
  pool = globalForPrisma.pgPool;
}

let adapter: PrismaPg;
if (process.env.NODE_ENV === 'production') {
  adapter = new PrismaPg(pool);
} else {
  if (!globalForPrisma.prismaAdapter) {
    globalForPrisma.prismaAdapter = new PrismaPg(pool);
  }
  adapter = globalForPrisma.prismaAdapter;
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}