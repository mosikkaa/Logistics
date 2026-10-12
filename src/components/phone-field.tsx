"use client";

import { AlertTriangle, Check, ChevronDown, Smartphone } from "lucide-react";
import { useId, useState, type ClipboardEvent } from "react";
import {
  COUNTRIES,
  DEFAULT_DIAL,
  countryByDial,
  formatLocal,
  isValidLocal,
  parsePhone,
  splitE164,
  toE164,
} from "@/lib/phone";

export type PhoneValue = { e164: string | null; dial: string; local: string };

type Status = "default" | "warning" | "success" | "error";

/**
 * Country code + number. Pasting "+995 599 12 34 56" (e.g. copied from
 * WhatsApp) switches the code selector to GE +995 and keeps only
 * "599 12 34 56" in the field, so the code is never doubled.
 */
export function PhoneField({
  name = "phone",
  defaultValue,
  onValueChange,
  status = "default",
  helper,
  label = "Phone number",
  hideLabels = false,
  autoFocus,
  disabled,
  placeholder = "599 12 34 56",
}: {
  name?: string;
  defaultValue?: string; // E.164
  onValueChange?: (v: PhoneValue) => void;
  status?: Status;
  helper?: string;
  label?: string;
  hideLabels?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  const id = useId();
  const initial = defaultValue ? splitE164(defaultValue) : { dial: DEFAULT_DIAL, local: "" };
  const [dial, setDial] = useState(initial.dial);
  const [local, setLocal] = useState(initial.local ? formatLocal(initial.local, initial.dial) : "");
  const [detected, setDetected] = useState<string | null>(null);

  const digits = local.replace(/\D/g, "");
  const hiddenValue = digits ? toE164(dial, digits) : "";

  function emit(nextDial: string, nextLocal: string) {
    const d = nextLocal.replace(/\D/g, "");
    onValueChange?.({ dial: nextDial, local: d, e164: isValidLocal(d) ? toE164(nextDial, d) : null });
  }

  function applyParsed(text: string) {
    const p = parsePhone(text, dial);
    const formatted = formatLocal(p.local, p.dial);
    setDial(p.dial);
    setLocal(formatted);
    if (p.detected) {
      const c = countryByDial(p.dial);
      setDetected(`Code +${p.dial}${c ? ` (${c.name})` : ""} detected from pasted number`);
    } else {
      setDetected(null);
    }
    emit(p.dial, formatted);
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (!text) return;
    e.preventDefault();
    applyParsed(text);
  }

  function onChange(value: string) {
    const compact = value.replace(/[^\d+]/g, "");
    // Typed or autofilled a full international number -> split it as well.
    if (compact.startsWith("+") || compact.startsWith("00") || compact.replace(/\D/g, "").length >= 11) {
      applyParsed(value);
      return;
    }
    const cleaned = value.replace(/[^\d\s\-()]/g, "");
    setLocal(cleaned);
    setDetected(null);
    emit(dial, cleaned);
  }

  const effectiveStatus: Status = detected && status === "default" ? "success" : status;
  const ring = {
    default: "border-line-strong focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15",
    warning: "border-amber-500 ring-4 ring-amber-500/15",
    success: "border-emerald-500 ring-4 ring-emerald-500/15",
    error: "border-red-500 ring-4 ring-red-500/15",
  }[effectiveStatus];
  const helperColor = {
    default: "text-ink-2",
    warning: "text-amber-700",
    success: "text-emerald-700",
    error: "text-red-600",
  }[effectiveStatus];
  const helperText = helper ?? detected;

  return (
    <div>
      <div className="flex items-end gap-2.5">
        <div className="w-[124px] shrink-0">
          {!hideLabels && (
            <label htmlFor={`${id}-code`} className="field-label">
              Code
            </label>
          )}
          <div className="relative">
            <select
              id={`${id}-code`}
              aria-label="Country code"
              value={dial}
              disabled={disabled}
              onChange={(e) => {
                setDial(e.target.value);
                setDetected(null);
                emit(e.target.value, local);
              }}
              className="field appearance-none pr-8"
            >
              {COUNTRIES.map((c) => (
                <option key={c.iso} value={c.dial}>
                  {c.iso} +{c.dial}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-ink-3" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          {!hideLabels && (
            <label htmlFor={`${id}-local`} className="field-label">
              {label}
            </label>
          )}
          <div className={`flex items-center gap-2 rounded-lg border bg-white px-3 transition-shadow ${ring}`}>
            <Smartphone className="size-[18px] shrink-0 text-ink-3" />
            <input
              id={`${id}-local`}
              type="tel"
              inputMode="tel"
              autoComplete="off"
              aria-label={hideLabels ? label : undefined}
              value={local}
              placeholder={placeholder}
              autoFocus={autoFocus}
              disabled={disabled}
              onPaste={onPaste}
              onChange={(e) => onChange(e.target.value)}
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-ink-3"
            />
            {effectiveStatus === "success" && <Check className="size-[18px] shrink-0 text-emerald-500" />}
            {(effectiveStatus === "warning" || effectiveStatus === "error") && (
              <AlertTriangle
                className={`size-[18px] shrink-0 ${effectiveStatus === "warning" ? "text-amber-500" : "text-red-500"}`}
              />
            )}
          </div>
        </div>
      </div>
      {helperText && <p className={`mt-1.5 pl-[134px] text-xs font-medium ${helperColor}`}>{helperText}</p>}
      <input type="hidden" name={name} value={hiddenValue} />
    </div>
  );
}
