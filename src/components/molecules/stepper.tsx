import { StepDot } from "@/components/atoms/step-dot";

export function Stepper({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3">
      <StepDot n={1} label="Phone number" state={step === 1 ? "active" : "done"} />
      <span className={`h-0.5 flex-1 rounded ${step === 2 ? "bg-emerald-500" : "bg-line"}`} />
      <StepDot n={2} label="Driver details" state={step === 2 ? "active" : "todo"} />
    </div>
  );
}
