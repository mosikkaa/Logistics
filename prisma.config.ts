import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // Migrations use the Supabase "Session pooler"/direct URL (port 5432), not the
  // transaction pooler. Not needed for `prisma generate` (runs on npm install).
  datasource: { url: process.env.DIRECT_URL || process.env.DATABASE_URL || "" },
});
