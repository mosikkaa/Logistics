import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/avatar";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-[28px] leading-9 font-semibold text-ink">Account</h1>
      <Suspense fallback={<div className="h-[360px] animate-pulse rounded-2xl bg-white" />}>
        <AccountContent />
      </Suspense>
    </div>
  );
}

async function AccountContent() {
  const me = await getCurrentUser();
  return (
    <>
      <section className="card flex items-center gap-4 p-6">
        <Avatar name={me.name} color={me.color} size={48} />
        <div>
          <p className="font-semibold text-ink">{me.name}</p>
          <p className="text-sm text-ink-2">
            {me.email} · {me.role === "ADMIN" ? "Admin" : "Logist"}
          </p>
        </div>
      </section>
      <section className="card p-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Change password</h2>
        <PasswordForm />
      </section>
    </>
  );
}
