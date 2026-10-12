"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { findDriverByPhone } from "@/lib/drivers";
import { normalizePhone } from "@/lib/phone";
import type { DriverDTO } from "@/lib/types";

/* ---------- Step 1: is this number already in the database? ---------- */

export type PhoneCheckResult =
  | { status: "invalid"; error: string }
  | { status: "new"; phone: string }
  | { status: "exists"; driver: DriverDTO };

export async function checkPhoneAction(raw: string): Promise<PhoneCheckResult> {
  await getCurrentUser();
  const phone = normalizePhone(raw);
  if (!phone) return { status: "invalid", error: "Enter a valid phone number" };
  const driver = await findDriverByPhone(phone);
  return driver ? { status: "exists", driver } : { status: "new", phone };
}

/* ---------- Step 2: save ---------- */

export type DriverFormState =
  | undefined
  | { ok: true }
  | { ok: false; error?: string; fieldErrors?: Partial<Record<keyof DriverInput, string>>; existing?: DriverDTO };

const DriverSchema = z.object({
  phone: z.string().trim().min(1, "Phone number is required"),
  name: z.string().trim().min(2, "Enter the driver's name").max(150),
  truckType: z.string().trim().min(1, "Choose a truck type").max(100),
  description: z.string().trim().max(2000, "Max 2000 characters").optional(),
  logistId: z.coerce.number().int().positive("Choose a logist"),
  destinationIds: z.array(z.coerce.number().int().positive()).min(1, "Pick at least one destination"),
});
type DriverInput = z.infer<typeof DriverSchema>;

function readForm(formData: FormData) {
  return DriverSchema.safeParse({
    phone: formData.get("phone") ?? "",
    name: formData.get("name") ?? "",
    truckType: formData.get("truckType") ?? "",
    description: formData.get("description") ?? undefined,
    logistId: formData.get("logistId") ?? "",
    destinationIds: formData.getAll("destinationIds"),
  });
}

function fieldErrors(error: z.ZodError<DriverInput>) {
  const out: Partial<Record<keyof DriverInput, string>> = {};
  for (const issue of error.issues) {
    const k = issue.path[0] as keyof DriverInput;
    if (k && !out[k]) out[k] = issue.message;
  }
  return out;
}

async function validateRelations(input: DriverInput) {
  const [logist, destCount] = await Promise.all([
    db.user.findFirst({ where: { id: input.logistId, isActive: true }, select: { id: true } }),
    db.destination.count({ where: { id: { in: input.destinationIds } } }),
  ]);
  if (!logist) return { logistId: "This logist no longer exists" };
  if (destCount !== input.destinationIds.length) return { destinationIds: "Unknown destination" };
  return null;
}

function isUniqueViolation(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002";
}

export async function createDriverAction(_prev: DriverFormState, formData: FormData): Promise<DriverFormState> {
  await getCurrentUser();
  const parsed = readForm(formData);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const input = parsed.data;

  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, fieldErrors: { phone: "Enter a valid phone number" } };

  const existing = await findDriverByPhone(phone);
  if (existing) return { ok: false, error: "This number is already in the database.", existing };

  const relErr = await validateRelations(input);
  if (relErr) return { ok: false, fieldErrors: relErr };

  try {
    await db.driver.create({
      data: {
        phone,
        name: input.name,
        truckType: input.truckType,
        description: input.description || null,
        logistId: input.logistId,
        destinations: { connect: input.destinationIds.map((id) => ({ id })) },
      },
    });
  } catch (e) {
    if (isUniqueViolation(e)) {
      const dup = await findDriverByPhone(phone);
      return { ok: false, error: "This number was just added by someone else.", existing: dup ?? undefined };
    }
    throw e;
  }
  refresh();
  return { ok: true };
}

async function loadEditable(id: number) {
  const user = await getCurrentUser();
  const driver = await db.driver.findUnique({ where: { id }, select: { id: true, logistId: true, phone: true } });
  if (!driver) return { error: "Driver not found" as const };
  if (user.role !== "ADMIN" && driver.logistId !== user.id) {
    return { error: "Only the driver's logist or an admin can change this driver" as const };
  }
  return { driver, user };
}

export async function updateDriverAction(
  id: number,
  _prev: DriverFormState,
  formData: FormData,
): Promise<DriverFormState> {
  const loaded = await loadEditable(id);
  if ("error" in loaded) return { ok: false, error: loaded.error };

  const parsed = readForm(formData);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const input = parsed.data;

  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, fieldErrors: { phone: "Enter a valid phone number" } };
  if (phone !== loaded.driver.phone) {
    const other = await findDriverByPhone(phone);
    if (other) return { ok: false, error: "Another driver already has this number.", existing: other };
  }

  const relErr = await validateRelations(input);
  if (relErr) return { ok: false, fieldErrors: relErr };

  try {
    await db.driver.update({
      where: { id },
      data: {
        phone,
        name: input.name,
        truckType: input.truckType,
        description: input.description || null,
        logistId: input.logistId,
        destinations: { set: input.destinationIds.map((destId) => ({ id: destId })) },
      },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { ok: false, fieldErrors: { phone: "Another driver already has this number" } };
    throw e;
  }
  refresh();
  return { ok: true };
}

export async function deleteDriverAction(id: number): Promise<{ ok: boolean; error?: string }> {
  const loaded = await loadEditable(id);
  if ("error" in loaded) return { ok: false, error: loaded.error };
  await db.driver.delete({ where: { id } });
  refresh();
  return { ok: true };
}
