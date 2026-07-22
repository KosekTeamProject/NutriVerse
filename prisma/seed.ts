import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Memulai proses seeding data...');

  // 1. Seed Master Badges
  const badge1 = await prisma.badge.upsert({
    where: { code: 'FIRST_STEP' },
    update: {},
    create: {
      code: 'FIRST_STEP',
      name: 'Langkah Pertama',
      description: 'Selesaikan aktivitas olahraga pertama Anda.',
      iconUrl: '/badges/first-step.png',
    },
  });

  const badge2 = await prisma.badge.upsert({
    where: { code: 'STREAK_MASTER' },
    update: {},
    create: {
      code: 'STREAK_MASTER',
      name: 'Streak Master',
      description: 'Pertahankan streak aktivitas selama 7 hari berturut-turut.',
      iconUrl: '/badges/streak-master.png',
    },
  });

  // 2. Seed Initial Challenge
  const challenge1 = await prisma.challenge.create({
    data: {
      title: 'Tantangan Jalan 10.000 Langkah',
      description: 'Capai total 10.000 langkah dalam seminggu untuk mendapatkan bonus XP dan HP.',
      type: 'WEEKLY',
      trustLevel: 'GPS_VERIFIED_ONLY',
      targetValue: 10000,
      targetUnit: 'STEPS',
      bonusXp: 500,
      bonusHp: 50,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  // 3. Seed Season Leaderboard Pertama
  const season1 = await prisma.leaderboardSeason.create({
    data: {
      name: 'Season 1: Origin Nutriverse',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  console.log('✅ Seeding selesai!');
  console.log({ badge1: badge1.name, badge2: badge2.name, challenge: challenge1.title, season: season1.name });
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });