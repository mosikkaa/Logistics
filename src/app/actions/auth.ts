"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { startSession } from "@/lib/auth";

// Compared against when the email doesn't exist, so timing is the same.
let dummyHash: string | undefined;
async function getDummyHash() {
  dummyHash ??= await bcrypt.hash("not-a-real-password", 10);
  return dummyHash;
}

export type LoginState = { error?: string; email?: string } | undefined;

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
  remember: z.string().optional(),
  next: z.string().optional(),
});

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", email: String(formData.get("email") ?? "") };
  }
  const { email, password, remember, next } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  // Always run bcrypt so response time doesn't reveal whether the email exists.
  const ok = await bcrypt.compare(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !ok) return { error: "Wrong email or password", email };
  if (!user.isActive) return { error: "This account is disabled. Ask the admin to enable it.", email };

  await startSession(user, remember === "on");

  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  redirect(safeNext);
}
