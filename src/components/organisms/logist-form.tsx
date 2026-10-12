"use client";

import { ChevronDown } from "lucide-react";
import { useActionState, useTransition } from "react";
import { createLogistAction, setLogistActiveAction, type LogistFormState } from "@/app/actions/logists";
import { AVATAR_COLORS } from "@/lib/constants";

export function LogistForm() {
  const [state, action, pending] = useActionState<LogistFormState, FormData>(createLogistAction, undefined);

  return (
    <form action={action} className="space-y-4" key={state?.ok ? state.message : "form"}>
      {state && (
        <p
          role="status"
          className={`rounded-lg px-3.5 py-2.5 text-sm ${
            state.ok ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {state.ok ? state.message : state.error}
        </p>
      )}
      <div>
        <label htmlFor="l-name" className="field-label">
          Full name
        </label>
        <input id="l-name" name="name" required className="field" placeholder="Nino Kikabidze" />
      </div>
      <div>
        <label htmlFor="l-email" className="field-label">
          Email
        </label>
        <input id="l-email" name="email" type="email" required className="field" placeholder="nino@company.ge" />
      </div>
      <div>
        <label htmlFor="l-password" className="field-label">
          Temporary password
        </label>
        <input id="l-password" name="password" type="text" minLength={8} required className="field" autoComplete="off" />
        <p className="mt-1.5 text-xs text-ink-2">At least 8 characters. They can change it on the Account page.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="l-role" className="field-label">
            Role
          </label>
          <div className="relative">
            <select id="l-role" name="role" defaultValue="LOGIST" className="field appearance-none pr-9">
              <option value="LOGIST">Logist</option>
              <option value="ADMIN">Admin</option>
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-3" />
          </div>
        </div>
        <fieldset>
          <legend className="field-label">Color</legend>
          <div className="flex flex-wrap gap-1.5 pt-1.5">
            {Object.entries(AVATAR_COLORS).map(([key, cls], i) => (
              <label key={key} className="cursor-pointer">
                <input type="radio" name="color" value={key} defaultChecked={i === 0} className="peer sr-only" />
                <span
                  className={`block size-7 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-brand-600 ${cls}`}
                  title={key}
                />
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Adding…" : "Add logist"}
      </button>
    </form>
  );
}

export function ToggleActiveButton({ userId, isActive }: { userId: number; isActive: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => void (await setLogistActiveAction(userId, !isActive)))}
      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
        isActive ? "bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-700" : "bg-canvas text-ink-2 hover:bg-emerald-50 hover:text-emerald-700"
      }`}
      title={isActive ? "Click to disable sign-in" : "Click to enable sign-in"}
    >
      {pending ? "…" : isActive ? "Active" : "Disabled"}
    </button>
  );
}
