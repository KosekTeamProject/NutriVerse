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
  const now = new Date();
  const challengeEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const challenge1 = await prisma.challenge.upsert({
    where: { id: 'challenge-weekly-walk-10km' },
    update: { startDate: now, endDate: challengeEnd, isActive: true },
    create: {
      id: 'challenge-weekly-walk-10km',
      title: 'Tantangan Jalan 10 Kilometer',
      description: 'Capai total 10 kilometer berjalan dalam seminggu untuk mendapatkan bonus XP dan HP.',
      type: 'WEEKLY',
      category: 'MOBILITY',
      trustLevel: 'GPS_VERIFIED_ONLY',
      metric: 'DISTANCE_METERS',
      activityType: 'WALK',
      targetValue: 10000,
      targetUnit: 'METERS',
      bonusXp: 500,
      bonusHp: 50,
      startDate: now,
      endDate: challengeEnd,
      isActive: true,
    },
  });

  // 3. Seed Season Leaderboard Pertama
  const season1 = (await prisma.leaderboardSeason.findFirst({
    where: { name: 'Season 1: Origin Nutriverse' },
  })) ?? await prisma.leaderboardSeason.create({
    data: {
      name: 'Season 1: Origin Nutriverse',
      startDate: now,
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  await Promise.all([
    prisma.reward.upsert({
      where: { id: 'reward-emerald-frame' },
      update: { stock: 100, isActive: true },
      create: {
        id: 'reward-emerald-frame',
        title: 'Frame Emerald',
        description: 'Bingkai profil digital khas NutriVerse.',
        partnerName: 'NutriVerse',
        imageUrl: '/brand/nutriverse-mark.svg',
        hpCost: 400,
        stock: 100,
      },
    }),
    prisma.reward.upsert({
      where: { id: 'reward-campus-voucher' },
      update: { stock: 25, isActive: true },
      create: {
        id: 'reward-campus-voucher',
        title: 'Voucher Makan Sehat Kampus',
        description: 'Voucher menu sehat untuk mitra kampus.',
        partnerName: 'Kantin Sehat AMIKOM',
        imageUrl: '/brand/nutriverse-mark.svg',
        hpCost: 350,
        stock: 25,
      },
    }),
    prisma.foodItem.upsert({
      where: { source_externalId: { source: 'LOCAL', externalId: 'tempe-100g' } },
      update: {},
      create: {
        source: 'LOCAL',
        externalId: 'tempe-100g',
        name: 'Tempe',
        caloriesPer100g: 193,
        proteinPer100g: 19,
        carbsPer100g: 7.6,
        fatPer100g: 11,
        isVerified: true,
      },
    }),
  ]);

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
