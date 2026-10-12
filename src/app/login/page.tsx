import type { Metadata } from "next";
import { Suspense } from "react";
import { Truck } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const DESTINATIONS = ["Turkey", "Azerbaijan", "Armenia", "Russia", "Kazakhstan", "Uzbekistan", "Europe", "Ukraine"];

export default function LoginPage() {
  return (
    <main className="flex min-h-screen">
      {/* Brand panel */}
      <section className="hidden w-[620px] shrink-0 flex-col bg-sidebar px-14 py-12 text-white lg:flex">
        <Logo />
        <div className="my-auto space-y-4">
          <h1 className="text-4xl leading-[44px] font-semibold">Every driver, every destination — in one place.</h1>
          <p className="text-base leading-6 text-sidebar-muted">
            Find a truck for Turkey, Russia or Europe in seconds, see who owns each contact, and never add the same
            number twice.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {DESTINATIONS.map((d) => (
              <span key={d} className="rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-medium">
                {d}
              </span>
            ))}
          </div>
        </div>
        <p className="text-sm text-sidebar-muted">Internal tool · access for company logists only</p>
      </section>

      {/* Form */}
      <section className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[480px] rounded-[20px] border border-line bg-white p-8 shadow-[0_12px_32px_rgba(16,24,40,0.06)] sm:p-10">
          <div className="mb-6 lg:hidden">
            <Logo dark={false} />
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

function Logo({ dark = true }: { dark?: boolean }) {
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
