"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { TRUCK_TYPES } from "@/lib/constants";
import type { LogistRef } from "@/lib/types";
import { Select } from "@/components/molecules/select";

/** Search + filters. Writes to the URL so filters are shareable and survive refresh. */
export function DriversToolbar({
  logists,
  initial,
}: {
  logists: LogistRef[];
  initial: { q: string; logist: string; truck: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(initial.q);
  const [pending, startTransition] = useTransition();
  const first = useRef(true);

  function update(changes: Record<string, string>) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    p.delete("page");
    const s = p.toString();
    startTransition(() => router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false }));
  }

  // debounce typing
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => update({ q: q.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className={`flex w-full flex-wrap items-center gap-3 sm:w-auto ${pending ? "opacity-70" : ""}`}>
      <div className="relative w-full sm:w-[340px]">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-ink-3" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, number or description"
          aria-label="Search drivers"
          className="field pr-9 pl-10"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-ink-3 hover:text-ink"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <Select
        label="Logist"
        value={initial.logist}
        onChange={(v) => update({ logist: v })}
        options={logists.map((l) => ({ value: String(l.id), label: l.name }))}
      />
      <Select
        label="Truck type"
        value={initial.truck}
        onChange={(v) => update({ truck: v })}
        options={TRUCK_TYPES.map((t) => ({ value: t, label: t }))}
      />
    </div>
  );
}
