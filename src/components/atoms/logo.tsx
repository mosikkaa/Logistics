import { Truck } from "lucide-react";

export function Logo({ dark = true }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex size-9 items-center justify-center rounded-[10px] bg-brand-600 text-white">
        <Truck className="size-5" />
      </span>
      <span>
        <span className={`block text-base leading-6 font-semibold ${dark ? "text-white" : "text-ink"}`}>
          Logistics CMS
        </span>
        <span className={`block text-xs ${dark ? "text-sidebar-muted" : "text-ink-2"}`}>Driver database</span>
      </span>
    </div>
  );
}
