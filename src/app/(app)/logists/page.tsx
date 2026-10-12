import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Avatar } from "@/components/avatar";
import { LogistForm, ToggleActiveButton } from "./logist-form";

export const metadata: Metadata = { title: "Logists" };

export default function LogistsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] leading-9 font-semibold text-ink">Logists</h1>
        <p className="mt-1 text-sm text-ink-2">People who can sign in and own drivers.</p>
      </div>
      <Suspense fallback={<div className="h-[400px] animate-pulse rounded-2xl bg-white" />}>
        <LogistsContent />
      </Suspense>
    </div>
  );
}

async function LogistsContent() {
  const me = await getCurrentUser();
  const users = await db.user.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      color: true,
      isActive: true,
      createdAt: true,
      _count: { select: { drivers: true } },
    },
  });
  const isAdmin = me.role === "ADMIN";

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-subtle text-xs font-semibold tracking-wide text-ink-2">
              <tr>
                <th className="px-5 py-3 font-semibold">LOGIST</th>
                <th className="px-3 py-3 font-semibold">EMAIL</th>
                <th className="px-3 py-3 font-semibold">ROLE</th>
                <th className="px-3 py-3 font-semibold">DRIVERS</th>
                <th className="px-5 py-3 font-semibold">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id} className={u.isActive ? "" : "opacity-60"}>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2.5">
                      <Avatar name={u.name} color={u.color} />
                      <span className="font-medium text-ink">
                        {u.name}
                        {u.id === me.id && <span className="ml-1 text-ink-3">(you)</span>}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-3 text-ink-2">{u.email}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        u.role === "ADMIN" ? "bg-sidebar text-white" : "bg-canvas text-ink-2"
                      }`}
                    >
                      {u.role === "ADMIN" ? "Admin" : "Logist"}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-medium text-ink">{u._count.drivers}</td>
                  <td className="px-5 py-3">
                    {isAdmin && u.id !== me.id ? (
                      <ToggleActiveButton userId={u.id} isActive={u.isActive} />
                    ) : (
                      <span className="text-[13px] text-ink-2">{u.isActive ? "Active" : "Disabled"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isAdmin ? (
        <section className="card h-fit p-6">
          <h2 className="text-base font-semibold text-ink">Add logist</h2>
          <p className="mt-1 mb-5 text-[13px] text-ink-2">They sign in with this email and password.</p>
          <LogistForm />
        </section>
      ) : (
        <p className="card h-fit p-6 text-sm text-ink-2">Only an admin can add or disable logists.</p>
      )}
    </div>
  );
}
