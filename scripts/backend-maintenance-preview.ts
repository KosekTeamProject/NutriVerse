import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { previewBackendMaintenance } from "../src/server/maintenance/backend-maintenance-service";

async function main() {
  try {
    const preview = await previewBackendMaintenance();
    console.log(JSON.stringify({ success: true, preview }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
