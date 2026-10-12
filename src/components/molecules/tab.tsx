import Link from "next/link";

export function Tab({ href, active, name, count, code }: { href: string; active: boolean; name: string; count: number; code?: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`min-w-[118px] flex-1 shrink-0 rounded-xl px-3.5 py-2.5 transition-colors ${
        active ? "bg-sidebar text-white" : "border border-line bg-white hover:border-line-strong"
      }`}
    >
      <span className={`block text-[13px] font-medium ${active ? "text-white" : "text-ink"}`}>{name}</span>
      <span className={`block text-xs ${active ? "text-sidebar-muted" : "text-ink-2"}`}>
        {code ? `${code} · ` : ""}
        {count} {count === 1 ? "driver" : "drivers"}
      </span>
    </Link>
  );
}
