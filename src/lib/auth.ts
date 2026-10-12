import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { SESSION_COOKIE, signSession, verifySession } from "./session";

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "LOGIST";
  color: string;
};

const DAY = 60 * 60 * 24;

/**
 * Data Access Layer: the one place that reads the session.
 * Returns the signed-in, active user or redirects to /login.
 * Deduplicated per request with React cache().
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.uid },
    select: { id: true, name: true, email: true, role: true, color: true, isActive: true },
  });
  if (!user || !user.isActive) redirect("/login");

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === "ADMIN" ? "ADMIN" : "LOGIST",
    color: user.color,
  };
});

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

export async function startSession(user: { id: number; role: string }, remember: boolean) {
  const maxAge = remember ? 30 * DAY : DAY;
  const token = await signSession({ uid: user.id, role: user.role }, maxAge);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}
