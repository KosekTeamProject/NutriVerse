import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { runBackendMaintenance } from "../src/server/maintenance/backend-maintenance-service";

async function main() {
  try {
    const report = await runBackendMaintenance();
    console.log(JSON.stringify({ success: true, report }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
