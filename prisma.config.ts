import 'dotenv/config';
import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // Utamakan DIRECT_URL (port 5432) untuk migrasi Prisma CLI
    url: process.env.DIRECT_URL || process.env.DATABASE_URL!,
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
});