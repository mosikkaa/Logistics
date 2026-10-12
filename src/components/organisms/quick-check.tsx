"use client";

import { Search } from "lucide-react";
import { useFormStatus } from "react-dom";
import { PhoneField } from "@/components/molecules/phone-field";
import { checkNumberAction } from "@/app/actions/check";

/** Header shortcut: check a number without leaving the dashboard. */
export function QuickCheck() {
  return (
    <form action={checkNumberAction} className="flex w-full items-start gap-2 sm:w-auto">
      <div className="min-w-0 flex-1 sm:w-[300px] sm:flex-none">
        <PhoneField hideLabels label="Quick number check" placeholder="Quick check…" />
      </div>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-secondary" disabled={pending}>
      <Search className="size-[18px]" />
      Check
    </button>
  );
}
