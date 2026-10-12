/**
 * Seeds destinations and the first admin account.
 *   npm run db:seed                 -> destinations + admin
 *   SEED_SAMPLE=1 npm run db:seed   -> also adds a few sample drivers and logists
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL! }) });

const DESTINATIONS = [
  { code: "GE", name: "Georgia" },
  { code: "TR", name: "Turkey" },
  { code: "RU", name: "Russia" },
  { code: "AM", name: "Armenia" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "BY", name: "Belarus" },
  { code: "CA", name: "Central Asia" },
  { code: "EU", name: "Europe" },
  { code: "CN", name: "China" },
  { code: "ALL", name: "All directions" },
];

async function upsertUser(u: { name: string; email: string; password: string; role: string; color: string }) {
  const email = u.email.trim().toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return existing;
  return db.user.create({
    data: { name: u.name, email, role: u.role, color: u.color, passwordHash: await bcrypt.hash(u.password, 12) },
  });
}

async function main() {
  for (const [i, d] of DESTINATIONS.entries()) {
    await db.destination.upsert({
      where: { code: d.code },
      update: { sortOrder: i },
      create: { ...d, sortOrder: i },
    });
  }
  console.log(`✓ ${DESTINATIONS.length} destinations`);

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding.");
  const admin = await upsertUser({
    name: process.env.ADMIN_NAME || "Admin",
    email,
    password,
    role: "ADMIN",
    color: "blue",
  });
  console.log(`✓ admin ${admin.email}`);

  if (process.env.SEED_SAMPLE === "1") {
    const nino = await upsertUser({ name: "Nino Kikabidze", email: "nino@example.com", password: "changeme123", role: "LOGIST", color: "rose" });
    const giorgi = await upsertUser({ name: "Giorgi Tsereteli", email: "giorgi@example.com", password: "changeme123", role: "LOGIST", color: "amber" });
    const dest = Object.fromEntries((await db.destination.findMany()).map((d) => [d.code, d.id]));
    const samples = [
      { phone: "+995599123456", name: "Giorgi Beridze", truckType: "Tent", logistId: admin.id, d: ["TR", "AZ"], description: "Available from 15 Oct. Prefers Poti port pickups" },
      { phone: "+995577452109", name: "Levan Kapanadze", truckType: "Refrigerator", logistId: nino.id, d: ["RU", "KZ"], description: "ADR certified, crosses via Upper Lars" },
      { phone: "+995555339012", name: "Davit Gelashvili", truckType: "Mega trailer", logistId: admin.id, d: ["EU"], description: "Schengen visa until 2027, CMR insured" },
      { phone: "+994502147731", name: "Elvin Mammadov", truckType: "Tilt", logistId: giorgi.id, d: ["AZ", "CA", "KZ"], description: "Regular Baku – Tashkent route" },
      { phone: "+37491552018", name: "Armen Petrosyan", truckType: "Container 40ft", logistId: giorgi.id, d: ["AM"], description: "Batumi port containers, own chassis" },
    ];
    for (const s of samples) {
      if (await db.driver.findUnique({ where: { phone: s.phone } })) continue;
      await db.driver.create({
        data: {
          phone: s.phone,
          name: s.name,
          truckType: s.truckType,
          description: s.description,
          logistId: s.logistId,
          destinations: { connect: s.d.map((c) => ({ id: dest[c]! })) },
        },
      });
    }
    console.log(`✓ sample data (logists' password: changeme123)`);
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
