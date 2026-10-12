"use client";

import { Info, Lock, Mail } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";

export function LoginForm() {
  const next = useSearchParams().get("next") ?? "";
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, undefined);

  return (
    <form action={action} className="space-y-5">
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Lock className="size-[22px]" />
      </span>
      <div>
        <h2 className="text-[28px] leading-9 font-semibold text-ink">Sign in</h2>
        <p className="mt-1.5 text-sm text-ink-2">Only company logists can access the driver database.</p>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <input type="hidden" name="next" value={next} />

      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-ink-3" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            defaultValue={state?.email}
            placeholder="you@company.ge"
            className="field pl-10"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-ink-3" />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="field pl-10"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-[13px] text-ink">
        <input type="checkbox" name="remember" defaultChecked className="size-[18px] rounded accent-brand-600" />
        Keep me signed in
      </label>

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="flex gap-2.5 rounded-[10px] border border-line bg-subtle px-3.5 py-3 text-[13px] text-ink-2">
        <Info className="mt-px size-[18px] shrink-0" />
        No account? Accounts are created by the admin — ask your manager for an invite.
      </p>
    </form>
  );
}
