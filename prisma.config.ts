import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // Not needed for `prisma generate` (runs on npm install), required for migrate/seed.
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
