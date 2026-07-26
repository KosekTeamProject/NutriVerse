import { prisma } from "./src/lib/prisma";
import { buildProgressOverview } from "./src/server/progress/progress-service";

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found");
    return;
  }
  
  // Call buildProgressOverview
  const overview = await buildProgressOverview(user.id);
  console.log("Current health pulse dimensions:", JSON.stringify(overview.healthPulse.current, null, 2));
}

main().catch(console.error);
