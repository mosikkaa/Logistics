import type { Metadata } from "next";
import { Suspense } from "react";
import { AlertTriangle, Check, Clock, Truck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { findDriverByPhone, getRecentChecks } from "@/lib/drivers";
import { formatPhone, normalizePhone, whatsappUrl } from "@/lib/phone";
import { Avatar, DestinationTag, LogistBadge } from "@/components/avatar";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { CheckForm } from "./check-form";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Check number" };

export default function CheckPage({ searchParams }: PageProps<"/check">) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] leading-9 font-semibold text-ink">Check number</h1>
        <p className="mt-1 text-sm text-ink-2">
          Find out in a second if a driver is already in the database — and which logist owns him.
        </p>
      </div>
      <Suspense fallback={<div className="h-[600px] animate-pulse rounded-2xl bg-white" />}>
        <CheckContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CheckContent({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  const raw = typeof sp.phone === "string" ? sp.phone : undefined;
  const phone = raw ? normalizePhone(raw) : null;
  const invalid = sp.invalid === "1" || (raw && !phone);

  const [driver, recent] = await Promise.all([phone ? findDriverByPhone(phone) : null, getRecentChecks(user.id)]);
  const canEditOwner = driver && (user.role === "ADMIN" || driver.logist.id === user.id);

  return (
    <>
      <section className="card p-6">
        <CheckForm key={phone ?? "empty"} defaultPhone={phone ?? undefined} invalid={Boolean(invalid)} />
      </section>

      {phone && driver && (
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-line bg-amber-50 px-6 py-3.5">
            <AlertTriangle className="size-5 text-amber-500" />
            <p className="flex-1 text-sm font-semibold text-amber-800">
              {formatPhone(driver.phone)} is already in the database
            </p>
            <p className="text-[13px] text-amber-800">
              Added {new Date(driver.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="flex flex-wrap gap-6 p-6">
            <Avatar name={driver.name} color="blue" size={64} />
            <div className="min-w-[260px] flex-1 space-y-3.5">
              <div>
                <p className="text-[22px] leading-[30px] font-semibold text-ink">{driver.name}</p>
                <p className="text-sm font-medium text-ink-2">{formatPhone(driver.phone)}</p>
              </div>
              <div className="flex flex-wrap gap-x-10 gap-y-4">
                <Fact k="Logist">
                  <LogistBadge name={driver.logist.name} color={driver.logist.color} full />
                </Fact>
                <Fact k="Truck type">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                    <Truck className="size-4 text-ink-2" />
                    {driver.truckType}
                  </span>
                </Fact>
                <Fact k="Destination">
                  <span className="flex flex-wrap gap-1">
                    {driver.destinations.map((d) => (
                      <DestinationTag key={d.id} name={d.name} />
                    ))}
                  </span>
                </Fact>
              </div>
              {driver.description && (
                <Fact k="Description">
                  <p className="text-sm text-ink">{driver.description}</p>
                </Fact>
              )}
            </div>
            <div className="flex w-full flex-col gap-2.5 sm:w-auto">
              <a href={whatsappUrl(driver.phone)} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                <WhatsAppIcon className="size-[18px] text-wa" />
                Message on WhatsApp
              </a>
              {!canEditOwner && (
                <p className="max-w-[220px] text-center text-xs text-ink-2">
                  Owned by {driver.logist.name}. Ask them before contacting this driver.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {phone && !driver && (
        <section className="card flex flex-col items-center gap-4 px-7 py-10 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-emerald-50">
            <Check className="size-7 text-emerald-500" />
          </span>
          <div>
            <p className="text-lg font-semibold text-ink">{formatPhone(phone)} is not in the database</p>
            <p className="mt-1.5 text-sm text-ink-2">
              No logist owns this number yet — you can add the driver now and he will be assigned to you.
            </p>
          </div>
          <Link href={`/?add=${encodeURIComponent(phone)}`} className="btn-primary">
            <Plus className="size-[18px]" />
            Add this driver
          </Link>
        </section>
      )}

      <section className="card overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4">
          <Clock className="size-[18px] text-ink-2" />
          <h2 className="text-base font-semibold text-ink">Your recent checks</h2>
        </div>
        {recent.length === 0 ? (
          <p className="border-t border-line px-6 py-6 text-sm text-ink-2">No checks yet.</p>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {recent.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-6 gap-y-1 px-6 py-3">
                <a href={`/check?phone=${encodeURIComponent(c.phone)}`} className="w-[200px] text-sm font-medium text-ink hover:underline">
                  {formatPhone(c.phone)}
                </a>
                <span className="w-[160px]">
                  {c.found ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      <AlertTriangle className="size-3.5" /> In database
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <Check className="size-3.5" /> New
                    </span>
                  )}
                </span>
                <span className="flex-1 text-[13px] text-ink-2">
                  {c.logistName ? `Logist: ${c.logistName}` : "Not assigned"}
                </span>
                <span className="text-[13px] text-ink-3">
                  {c.createdAt.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Fact({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold tracking-wide text-ink-3 uppercase">{k}</p>
      {children}
    </div>
  );
}
