"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Settings, UserCheck, Users } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Drivers", icon: Users },
  { href: "/check", label: "Check number", icon: Search },
  { href: "/logists", label: "Logists", icon: UserCheck },
  { href: "/account", label: "Account", icon: Settings },
] as const;

export function SidebarNav({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  if (compact) {
    return (
      <nav className="flex gap-1">
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={`inline-flex size-9 items-center justify-center rounded-lg ${
              isActive(href) ? "bg-sidebar-active text-white" : "text-sidebar-muted"
            }`}
          >
            <Icon className="size-[18px]" />
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-1.5">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-sidebar-active text-white" : "text-sidebar-muted hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="size-[18px]" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
