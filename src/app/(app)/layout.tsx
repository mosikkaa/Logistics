import { Suspense } from "react";
import { LogOut, Truck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/atoms/avatar";
import { SidebarNav } from "@/components/organisms/sidebar-nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1.5 bg-sidebar px-4 pt-6 pb-5 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <span className="inline-flex size-9 items-center justify-center rounded-[10px] bg-brand-600 text-white">
            <Truck className="size-5" />
          </span>
          <span>
            <span className="block text-base leading-6 font-semibold text-white">Logistics CMS</span>
            <span className="block text-xs text-sidebar-muted">Driver database</span>
          </span>
        </div>
        <p className="mt-6 px-3 pb-1 text-xs font-semibold tracking-wide text-sidebar-muted">MENU</p>
        <SidebarNav />
        <div className="mt-auto">
          <Suspense fallback={<div className="h-[54px] rounded-[10px] bg-sidebar-active" />}>
            <UserCard />
          </Suspense>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 bg-sidebar px-4 py-3 lg:hidden">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Truck className="size-4" />
          </span>
          <span className="font-semibold text-white">Logistics CMS</span>
          <div className="ml-auto">
            <SidebarNav compact />
          </div>
        </header>
        <main className="px-4 py-6 sm:px-8 sm:pt-7 sm:pb-8">{children}</main>
      </div>
    </div>
  );
}

async function UserCard() {
  const user = await getCurrentUser();
  return (
    <div className="flex items-center gap-2.5 rounded-[10px] bg-sidebar-active p-2.5">
      <Avatar name={user.name} color={user.color} size={34} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-white">{user.name}</p>
        <p className="text-xs text-sidebar-muted">{user.role === "ADMIN" ? "Logist · Admin" : "Logist"}</p>
      </div>
      <form action="/logout" method="post">
        <button
          type="submit"
          title="Sign out"
          aria-label="Sign out"
          className="inline-flex size-8 items-center justify-center rounded-lg text-sidebar-muted hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-[18px]" />
        </button>
      </form>
    </div>
  );
}
