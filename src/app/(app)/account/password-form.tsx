"use client";

import { useActionState } from "react";
import { changePasswordAction, type LogistFormState } from "@/app/actions/logists";

export function PasswordForm() {
  const [state, action, pending] = useActionState<LogistFormState, FormData>(changePasswordAction, undefined);
  return (
    <form action={action} className="space-y-4" key={state?.ok ? "done" : "form"}>
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
        <label htmlFor="current" className="field-label">
          Current password
        </label>
        <input id="current" name="current" type="password" required autoComplete="current-password" className="field" />
      </div>
      <div>
        <label htmlFor="next" className="field-label">
          New password
        </label>
        <input id="next" name="next" type="password" minLength={8} required autoComplete="new-password" className="field" />
      </div>
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
