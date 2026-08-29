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
    update: { criteriaKey: 'VERIFIED_ACTIVITY_COUNT', targetValue: 1 },
    create: {
      code: 'FIRST_STEP',
      name: 'Langkah Pertama',
      description: 'Selesaikan aktivitas olahraga pertama Anda.',
      iconUrl: '/badges/first-step.png',
      criteriaKey: 'VERIFIED_ACTIVITY_COUNT',
      targetValue: 1,
    },
  });

  const badge2 = await prisma.badge.upsert({
    where: { code: 'STREAK_MASTER' },
    update: { criteriaKey: 'STREAK_DAYS', targetValue: 7 },
    create: {
      code: 'STREAK_MASTER',
      name: 'Streak Master',
      description: 'Pertahankan streak aktivitas selama 7 hari berturut-turut.',
      iconUrl: '/badges/streak-master.png',
      criteriaKey: 'STREAK_DAYS',
      targetValue: 7,
    },
  });
  await Promise.all([
    {
      code: 'ACTIVE_10', name: 'Ritme Terbentuk',
      description: 'Selesaikan 10 aktivitas yang lolos verifikasi.',
      iconUrl: '/badges/active-10.png', criteriaKey: 'VERIFIED_ACTIVITY_COUNT', targetValue: 10,
    },
    {
      code: 'DISTANCE_50K', name: 'Penjelajah 50K',
      description: 'Tempuh total 50 kilometer dari aktivitas terverifikasi.',
      iconUrl: '/badges/distance-50k.png', criteriaKey: 'VERIFIED_DISTANCE_METERS', targetValue: 50000,
    },
    {
      code: 'CHALLENGE_5', name: 'Pemburu Tantangan',
      description: 'Selesaikan 5 tantangan terverifikasi.',
      iconUrl: '/badges/challenge-5.png', criteriaKey: 'COMPLETED_CHALLENGE_COUNT', targetValue: 5,
    },
    {
      code: 'EVENT_EXPLORER', name: 'Event Explorer',
      description: 'Hadir dan terverifikasi di 3 event NutriVerse.',
      iconUrl: '/badges/event-explorer.png', criteriaKey: 'ATTENDED_EVENT_COUNT', targetValue: 3,
    },
  ].map((badge) => prisma.badge.upsert({
    where: { code: badge.code },
    update: badge,
    create: badge,
  })));

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
  await Promise.all([
    prisma.challenge.upsert({
      where: { id: 'challenge-daily-walk-2km' },
      update: {
        startDate: now,
        endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        isActive: true,
      },
      create: {
        id: 'challenge-daily-walk-2km',
        title: 'Jalan Santai 2 Kilometer',
        description: 'Kumpulkan 2 kilometer jalan kaki tervalidasi hari ini.',
        type: 'DAILY',
        category: 'MOBILITY',
        trustLevel: 'GPS_VERIFIED_ONLY',
        metric: 'DISTANCE_METERS',
        activityType: 'WALK',
        targetValue: 2000,
        targetUnit: 'METERS',
        bonusXp: 120,
        bonusHp: 25,
        startDate: now,
        endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
    }),
    prisma.challenge.upsert({
      where: { id: 'challenge-daily-active-20m' },
      update: {
        startDate: now,
        endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        isActive: true,
      },
      create: {
        id: 'challenge-daily-active-20m',
        title: 'Aktif 20 Menit',
        description: 'Akumulasikan 20 menit aktivitas GPS yang lolos verifikasi.',
        type: 'DAILY',
        category: 'CARDIO',
        trustLevel: 'GPS_VERIFIED_ONLY',
        metric: 'DURATION_SECONDS',
        targetValue: 1200,
        targetUnit: 'SECONDS',
        bonusXp: 150,
        bonusHp: 30,
        startDate: now,
        endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
    }),
    prisma.challenge.upsert({
      where: { id: 'challenge-monthly-distance-80km' },
      update: {
        startDate: now,
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      create: {
        id: 'challenge-monthly-distance-80km',
        title: 'Jarak Bulanan 80 Kilometer',
        description: 'Akumulasikan 80 kilometer aktivitas tervalidasi bulan ini.',
        type: 'MONTHLY',
        category: 'CARDIO',
        trustLevel: 'GPS_VERIFIED_ONLY',
        metric: 'DISTANCE_METERS',
        targetValue: 80000,
        targetUnit: 'METERS',
        bonusXp: 2000,
        bonusHp: 350,
        startDate: now,
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  // 3. Seed Season Leaderboard Pertama
  const existingSeason = await prisma.leaderboardSeason.findFirst({
    where: { name: 'Season 1: Origin Nutriverse' },
  });
  const season1 = existingSeason
    ? await prisma.leaderboardSeason.update({
        where: { id: existingSeason.id },
        data: {
          startDate: now,
          endDate: new Date(now.getTime() + 84 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      })
    : await prisma.leaderboardSeason.create({
        data: {
          name: 'Season 1: Origin Nutriverse',
          startDate: now,
          endDate: new Date(now.getTime() + 84 * 24 * 60 * 60 * 1000),
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
    prisma.event.upsert({
      where: { id: 'event-jakarta-night-walk' },
      update: {
        startDate: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        isActive: true,
      },
      create: {
        id: 'event-jakarta-night-walk',
        title: 'Jakarta Night Walk 4K',
        description: 'Jalan malam komunitas dengan rute ramah pemula.',
        bannerUrl: '/images/dashboard-hero.png',
        startDate: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        location: 'Lapangan Banteng, Jakarta',
        capacity: 450,
        bonusXp: 320,
        bonusHp: 80,
      },
    }),
    prisma.event.upsert({
      where: { id: 'event-amikom-morning-run' },
      update: {
        startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        isActive: true,
      },
      create: {
        id: 'event-amikom-morning-run',
        title: 'AMIKOM Morning Run 5K',
        description: 'Lari pagi komunitas kampus dengan validasi kehadiran.',
        bannerUrl: '/images/dashboard-hero.png',
        startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        location: 'Embung AMIKOM, Yogyakarta',
        capacity: 600,
        bonusXp: 450,
        bonusHp: 100,
      },
    }),
    prisma.guild.upsert({
      where: { name: 'Running Club' },
      update: {},
      create: {
        name: 'Running Club',
        description: 'Lingkaran untuk pejalan dan pelari NutriVerse.',
      },
    }),
    prisma.guild.upsert({
      where: { name: 'Hydration Squad' },
      update: {},
      create: {
        name: 'Hydration Squad',
        description: 'Saling mengingatkan kebiasaan hidrasi harian.',
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
