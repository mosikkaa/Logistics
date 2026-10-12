import type { Metadata } from "next";
import { Suspense } from "react";
import { Pencil, Truck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getDestinationTabs, getDestinations, getLogists, listDrivers } from "@/lib/drivers";
import { formatPhone, whatsappUrl } from "@/lib/phone";
import { DestinationTag } from "@/components/atoms/avatar";
import { LogistBadge } from "@/components/molecules/logist-badge";
import { WhatsAppButton } from "@/components/molecules/whatsapp-button";
import { Tab } from "@/components/molecules/tab";
import { Pagination } from "@/components/molecules/pagination";
import { AddDriverButton, DriverDialogProvider, EditDriverButton } from "@/components/organisms/driver-dialog";
import { DriversToolbar } from "@/components/organisms/drivers-toolbar";
import { QuickCheck } from "@/components/organisms/quick-check";
import { DashboardSkeleton } from "@/components/organisms/dashboard-skeleton";

export const metadata: Metadata = { title: "Drivers" };

type SP = Record<string, string | string[] | undefined>;

export default function DriversPage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

function hrefWith(sp: SP, changes: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const val = one(v);
    if (val && k !== "page") p.set(k, val);
  }
  for (const [k, v] of Object.entries(changes)) {
    if (v) p.set(k, v);
    else p.delete(k);
  }
  const s = p.toString();
  return s ? `/?${s}` : "/";
}

async function Dashboard({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  const logistParam = one(sp.logist);
  const filters = {
    dest: one(sp.dest),
    q: one(sp.q),
    truck: one(sp.truck),
    // No ?logist= in the URL yet (first visit) -> default to "my drivers".
    // ?logist=all is the explicit "show everyone" choice from the dropdown.
    logist: logistParam === undefined ? user.id : logistParam === "all" ? undefined : Number(logistParam) || undefined,
    page: Number(one(sp.page)) || 1,
  };

  const [{ tabs, total }, list, allLogists, destinations] = await Promise.all([
    getDestinationTabs(filters.logist),
    listDrivers(filters),
    getLogists(),
    getDestinations(),
  ]);
  const activeLogists = allLogists; // inactive logists still own drivers; filter list shows all
  const from = list.total ? (list.page - 1) * 20 + 1 : 0;
  const to = Math.min(list.page * 20, list.total);

  return (
    <DriverDialogProvider
      key={one(sp.add) ?? "none"}
      initialAddPhone={one(sp.add)}
      currentUserId={user.id}
      logists={activeLogists}
      destinations={destinations.map((d) => ({ id: d.id, code: d.code, name: d.name }))}
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <h1 className="text-[28px] leading-9 font-semibold text-ink">Drivers</h1>
            <p className="mt-1 text-sm text-ink-2">
              {total} {total === 1 ? "driver" : "drivers"} · {tabs.length} destinations
            </p>
          </div>
          <QuickCheck />
          <AddDriverButton />
        </div>

        {/* Destination tabs */}
        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Destinations">
          <Tab href={hrefWith(sp, { dest: undefined })} active={!filters.dest} name="All" count={total} />
          {tabs.map((t) => (
            <Tab
              key={t.code}
              href={hrefWith(sp, { dest: t.code })}
              active={filters.dest === t.code}
              name={t.name}
              count={t.count}
              code={t.code}
            />
          ))}
        </nav>

        {/* Table */}
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 px-5 py-4">
            <DriversToolbar
              logists={allLogists}
              initial={{ q: filters.q ?? "", logist: logistParam ?? String(user.id), truck: filters.truck ?? "" }}
            />
            <p className="ml-auto text-[13px] text-ink-2">
              {list.total ? `Showing ${from}–${to} of ${list.total}` : "No drivers"}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="border-y border-line bg-subtle text-xs font-semibold tracking-wide text-ink-2">
                <tr>
                  <th className="px-5 py-3 font-semibold">LOGIST</th>
                  <th className="px-3 py-3 font-semibold">NUMBER</th>
                  <th className="px-3 py-3 font-semibold">NAME</th>
                  <th className="px-3 py-3 font-semibold">TRUCK TYPE</th>
                  <th className="px-3 py-3 font-semibold">DESTINATION</th>
                  <th className="px-3 py-3 font-semibold">DESCRIPTION</th>
                  <th className="px-5 py-3 text-center font-semibold">WHATSAPP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.drivers.map((d) => {
                  const canEdit = user.role === "ADMIN" || d.logist.id === user.id;
                  return (
                    <tr key={d.id} className="align-middle hover:bg-subtle/60">
                      <td className="w-[160px] px-5 py-3.5">
                        <LogistBadge name={d.logist.name} color={d.logist.color} />
                      </td>
                      <td className="w-[170px] px-3 py-3.5 text-sm font-medium whitespace-nowrap text-ink">
                        {formatPhone(d.phone)}
                      </td>
                      <td className="w-[180px] px-3 py-3.5 text-sm">
                        {canEdit ? (
                          <EditDriverButton driver={d}>
                            <span className="inline-flex items-center gap-1.5">
                              {d.name}
                              <Pencil className="size-3.5 text-ink-3" />
                            </span>
                          </EditDriverButton>
                        ) : (
                          <span className="font-medium text-ink">{d.name}</span>
                        )}
                      </td>
                      <td className="w-[150px] px-3 py-3.5 text-[13px] text-ink">
                        <span className="inline-flex items-center gap-2">
                          <Truck className="size-4 shrink-0 text-ink-2" />
                          {d.truckType}
                        </span>
                      </td>
                      <td className="w-[220px] px-3 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {d.destinations.map((x) => (
                            <DestinationTag key={x.id} name={x.name} />
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-[13px] text-ink-2">
                        <p className="line-clamp-2" title={d.description ?? undefined}>
                          {d.description || "—"}
                        </p>
                      </td>
                      <td className="w-[90px] px-5 py-3.5 text-center">
                        <WhatsAppButton href={whatsappUrl(d.phone)} label={`WhatsApp ${d.name}`} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {list.drivers.length === 0 && (
              <div className="px-5 py-16 text-center">
                <p className="font-semibold text-ink">No drivers found</p>
                <p className="mt-1 text-sm text-ink-2">
                  {filters.q || filters.logist || filters.truck || filters.dest
                    ? "Try another destination or clear the filters."
                    : "Add your first driver with the “Add driver” button."}
                </p>
              </div>
            )}
          </div>

          {list.pageCount > 1 && (
            <Pagination page={list.page} pageCount={list.pageCount} hrefFor={(p) => hrefWith(sp, { page: String(p) })} />
          )}
        </section>
      </div>
    </DriverDialogProvider>
  );
}

