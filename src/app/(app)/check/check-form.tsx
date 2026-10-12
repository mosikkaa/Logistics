"use client";

import { Search } from "lucide-react";
import { useFormStatus } from "react-dom";
import { PhoneField } from "@/components/phone-field";
import { checkNumberAction } from "@/app/actions/check";

export function CheckForm({ defaultPhone, invalid }: { defaultPhone?: string; invalid: boolean }) {
  return (
    <form action={checkNumberAction} className="space-y-3">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-[280px] flex-1">
          <PhoneField
            defaultValue={defaultPhone}
            autoFocus={!defaultPhone}
            status={invalid ? "error" : "default"}
            helper={invalid ? "That doesn't look like a phone number" : undefined}
          />
        </div>
        <div className="pt-[26px]">
          <Submit />
        </div>
      </div>
      <p className="text-xs font-medium text-ink-2">
        Tip: paste a number in any format — spaces, +, 00 and dashes are ignored, and the country code is detected
        automatically.
      </p>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      <Search className="size-[18px]" />
      {pending ? "Checking…" : "Check"}
    </button>
  );
}
