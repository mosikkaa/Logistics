"use server";

import bcrypt from "bcryptjs";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { AVATAR_COLORS } from "@/lib/constants";

export type LogistFormState = undefined | { ok: true; message: string } | { ok: false; error: string };

const LogistSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "LOGIST"]),
  color: z.string().refine((c) => c in AVATAR_COLORS, "Unknown color"),
});

export async function createLogistAction(_prev: LogistFormState, formData: FormData): Promise<LogistFormState> {
  await requireAdmin();
  const parsed = LogistSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { name, email, password, role, color } = parsed.data;

  if (await db.user.findUnique({ where: { email } })) {
    return { ok: false, error: "A logist with this email already exists" };
  }
  await db.user.create({
    data: { name, email, role, color, passwordHash: await bcrypt.hash(password, 12) },
  });
  refresh();
  return { ok: true, message: `${name} can now sign in with ${email}` };
}

export async function setLogistActiveAction(userId: number, isActive: boolean) {
  const admin = await requireAdmin();
  if (userId === admin.id) return { ok: false, error: "You can't disable your own account" };
  await db.user.update({ where: { id: userId }, data: { isActive } });
  refresh();
  return { ok: true };
}

const PasswordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: z.string().min(8, "New password must be at least 8 characters"),
  });

export async function changePasswordAction(_prev: LogistFormState, formData: FormData): Promise<LogistFormState> {
  const me = await getCurrentUser();
  const parsed = PasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
  if (!(await bcrypt.compare(parsed.data.current, user.passwordHash))) {
    return { ok: false, error: "Current password is wrong" };
  }
  await db.user.update({ where: { id: me.id }, data: { passwordHash: await bcrypt.hash(parsed.data.next, 12) } });
  return { ok: true, message: "Password changed" };
}
