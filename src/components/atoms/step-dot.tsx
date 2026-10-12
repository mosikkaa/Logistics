import { Check } from "lucide-react";

export function StepDot({ n, label, state }: { n: number; label: string; state: "active" | "done" | "todo" }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
          state === "done"
            ? "bg-emerald-500 text-white"
            : state === "active"
              ? "bg-brand-600 text-white"
              : "border border-line-strong bg-canvas text-ink-2"
        }`}
      >
        {state === "done" ? <Check className="size-3.5" /> : n}
      </span>
      <span className={`text-[13px] font-medium ${state === "todo" ? "text-ink-2" : "text-ink"}`}>{label}</span>
    </span>
  );
}
