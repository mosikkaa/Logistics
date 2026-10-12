import "server-only";
import { db } from "./db";
import type { Prisma } from "@/generated/prisma/client";
import { PAGE_SIZE } from "./constants";
import type { DriverDTO } from "./types";

const driverSelect = {
  id: true,
  phone: true,
  name: true,
  truckType: true,
  description: true,
  createdAt: true,
  logist: { select: { id: true, name: true, color: true } },
  destinations: { select: { id: true, code: true, name: true }, orderBy: { sortOrder: "asc" } },
} satisfies Prisma.DriverSelect;

type DriverRow = Prisma.DriverGetPayload<{ select: typeof driverSelect }>;

export function toDTO(d: DriverRow): DriverDTO {
  return { ...d, createdAt: d.createdAt.toISOString() };
}

export async function getDestinations() {
  return db.destination.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export async function getDestinationTabs() {
  const [destinations, total] = await Promise.all([
    db.destination.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, code: true, name: true, _count: { select: { drivers: true } } },
    }),
    db.driver.count(),
  ]);
  return {
    total,
    tabs: destinations.map((d) => ({ id: d.id, code: d.code, name: d.name, count: d._count.drivers })),
  };
}

export async function getLogists(opts: { activeOnly?: boolean } = {}) {
  return db.user.findMany({
    where: opts.activeOnly ? { isActive: true } : undefined,
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });
}

export type DriverFilters = {
  dest?: string;
  q?: string;
  logist?: number;
  truck?: string;
  page?: number;
};

export async function listDrivers(f: DriverFilters) {
  const and: Prisma.DriverWhereInput[] = [];
  if (f.dest) and.push({ destinations: { some: { code: f.dest } } });
  if (f.logist) and.push({ logistId: f.logist });
  if (f.truck) and.push({ truckType: f.truck });
  if (f.q) {
    const q = f.q.trim();
    const digits = q.replace(/\D/g, "");
    const or: Prisma.DriverWhereInput[] = [
      { name: { contains: q } },
      { description: { contains: q } },
      { truckType: { contains: q } },
    ];
    // "599 12 34" or "+995 599..." -> match on stored digits
    if (digits.length >= 3) or.push({ phone: { contains: digits.replace(/^00/, "") } });
    and.push({ OR: or });
  }
  const where: Prisma.DriverWhereInput = and.length ? { AND: and } : {};
  const page = Math.max(1, f.page ?? 1);

  const [total, rows] = await Promise.all([
    db.driver.count({ where }),
    db.driver.findMany({
      where,
      select: driverSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return {
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    drivers: rows.map(toDTO),
  };
}

export async function findDriverByPhone(e164: string): Promise<DriverDTO | null> {
  const d = await db.driver.findUnique({ where: { phone: e164 }, select: driverSelect });
  return d ? toDTO(d) : null;
}

export async function findDriverById(id: number) {
  return db.driver.findUnique({ where: { id }, select: driverSelect });
}

export async function getRecentChecks(userId: number, take = 8) {
  const checks = await db.numberCheck.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
  if (!checks.length) return [];
  // who owns each number *now*
  const owners = await db.driver.findMany({
    where: { phone: { in: [...new Set(checks.map((c) => c.phone))] } },
    select: { phone: true, logist: { select: { name: true } } },
  });
  const ownerByPhone = new Map(owners.map((o) => [o.phone, o.logist.name]));
  return checks.map((c) => ({
    id: c.id,
    phone: c.phone,
    found: ownerByPhone.has(c.phone),
    logistName: ownerByPhone.get(c.phone) ?? null,
    createdAt: c.createdAt,
  }));
}
