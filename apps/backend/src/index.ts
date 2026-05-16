import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { app } from "./app.js";

const server = app.listen(env.PORT, () => {
  console.log(`API server listening on port ${env.PORT}`);
});

async function shutdown() {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
