import "dotenv/config";
import { PrismaClient, ShareTemplateAspectRatio, ShareTemplateStatus, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL atau DATABASE_URL belum tersedia.");

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const templateId = "template-daily-health-pulse-v1";
const backgroundUrl = "/templates/daily-health-pulse.svg";
const layoutConfig = {
  photoAsBackground: true,
  elements: [
    { id: "moment-photo-background", kind: "image", dataKey: "moment.photo", x: 0, y: 0, width: 100, height: 100, fontSize: 32, color: "#ffffff", align: "left", required: true, userCanHide: false },
    { id: "username", kind: "text", dataKey: "user.username", x: 7.5, y: 27, width: 55, height: 5, fontSize: 34, color: "#d9f8e8", align: "left", required: true, userCanHide: false },
    { id: "pulse-current", kind: "text", dataKey: "healthPulse.current", x: 10, y: 38, width: 80, height: 10, fontSize: 84, color: "#ffffff", align: "left", required: true, userCanHide: false },
    { id: "pulse-trend", kind: "text", dataKey: "healthPulse.trend", x: 10, y: 49, width: 48, height: 5, fontSize: 34, color: "#b7ff5f", align: "left", required: true, userCanHide: false },
    { id: "streak", kind: "text", dataKey: "progress.streak", x: 10, y: 69, width: 34, height: 8, fontSize: 48, color: "#ffffff", align: "left", required: true, userCanHide: false },
    { id: "rank", kind: "text", dataKey: "progress.rank", x: 55.5, y: 69, width: 34, height: 8, fontSize: 48, color: "#ffffff", align: "left", required: true, userCanHide: false },
    { id: "pulse-delta", kind: "text", dataKey: "healthPulse.delta", x: 10, y: 87, width: 80, height: 6, fontSize: 32, color: "#ffffff", align: "left", required: true, userCanHide: false },
  ],
};

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN, isSuspended: false },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
  if (!admin) throw new Error("Tidak ada akun ADMIN aktif untuk menjadi pembuat template.");

  const template = await prisma.shareTemplate.upsert({
    where: { id: templateId },
    update: {
      name: "Daily Health Pulse",
      description: "Foto sebagai background penuh dengan overlay Health Pulse, perubahan harian, streak, dan rank.",
      category: "Health Pulse",
      aspectRatio: ShareTemplateAspectRatio.PORTRAIT,
      width: 1080,
      height: 1350,
      backgroundUrl,
      thumbnailUrl: backgroundUrl,
      layoutConfig,
      allowedDataKeys: ["moment.photo", "user.username", "healthPulse.current", "healthPulse.trend", "progress.streak", "progress.rank", "healthPulse.delta"],
      status: ShareTemplateStatus.PUBLISHED,
      version: 2,
      publishedByUserId: admin.id,
      publishedAt: new Date(),
    },
    create: {
      id: templateId,
      name: "Daily Health Pulse",
      description: "Foto sebagai background penuh dengan overlay Health Pulse, perubahan harian, streak, dan rank.",
      category: "Health Pulse",
      aspectRatio: ShareTemplateAspectRatio.PORTRAIT,
      width: 1080,
      height: 1350,
      backgroundUrl,
      thumbnailUrl: backgroundUrl,
      layoutConfig,
      allowedDataKeys: ["moment.photo", "user.username", "healthPulse.current", "healthPulse.trend", "progress.streak", "progress.rank", "healthPulse.delta"],
      status: ShareTemplateStatus.PUBLISHED,
      version: 2,
      createdByUserId: admin.id,
      publishedByUserId: admin.id,
      publishedAt: new Date(),
    },
    select: { id: true, name: true, status: true, createdBy: { select: { name: true } } },
  });

  console.log(JSON.stringify({ success: true, template }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
