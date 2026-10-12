"use client";

import { AlertTriangle, ArrowLeft, Check, ChevronDown, Eye, Info, Plus, Search, Trash2, Truck } from "lucide-react";
import {
  createContext,
  use,
  useActionState,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { PhoneField, type PhoneValue } from "@/components/phone-field";
import { DestinationTag, LogistBadge } from "@/components/avatar";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import {
  checkPhoneAction,
  createDriverAction,
  deleteDriverAction,
  updateDriverAction,
  type DriverFormState,
} from "@/app/actions/drivers";
import { TRUCK_TYPES } from "@/lib/constants";
import { formatPhone, normalizePhone, splitE164, whatsappUrl } from "@/lib/phone";
import type { DestinationRef, DriverDTO, LogistRef } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Context: lets any button on the page open the Add / Edit dialog     */
/* ------------------------------------------------------------------ */

type DialogState =
  | { mode: "closed" }
  | { mode: "create"; key: number; phone?: string }
  | { mode: "edit"; key: number; driver: DriverDTO };

type Ctx = { openCreate: () => void; openEdit: (d: DriverDTO) => void };
const DialogCtx = createContext<Ctx | null>(null);

function useDriverDialog() {
  const ctx = use(DialogCtx);
  if (!ctx) throw new Error("useDriverDialog must be used inside DriverDialogProvider");
  return ctx;
}

type Shared = { currentUserId: number; logists: LogistRef[]; destinations: DestinationRef[] };

export function DriverDialogProvider({
  children,
  initialAddPhone,
  ...shared
}: Shared & { children: ReactNode; initialAddPhone?: string }) {
  const router = useRouter();
  const [state, setState] = useState<DialogState>(
    initialAddPhone ? { mode: "create", key: 1, phone: initialAddPhone } : { mode: "closed" },
  );
  const ctx: Ctx = {
    openCreate: () => setState({ mode: "create", key: Date.now() }),
    openEdit: (driver) => setState({ mode: "edit", key: Date.now(), driver }),
  };
  const close = () => {
    setState({ mode: "closed" });
    // opened from "Check number → Add this driver": drop ?add= from the URL
    if (initialAddPhone) {
      const p = new URLSearchParams(window.location.search);
      p.delete("add");
      const s = p.toString();
      router.replace(s ? `/?${s}` : "/", { scroll: false });
    }
  };

  return (
    <DialogCtx value={ctx}>
      {children}
      {state.mode === "create" && (
        <CreateDriverDialog key={state.key} initialPhone={state.phone} onClose={close} {...shared} />
      )}
      {state.mode === "edit" && <EditDriverDialog key={state.key} driver={state.driver} onClose={close} {...shared} />}
    </DialogCtx>
  );
}

export function AddDriverButton() {
  const { openCreate } = useDriverDialog();
  return (
    <button type="button" onClick={openCreate} className="btn-primary">
      <Plus className="size-[18px]" />
      Add driver
    </button>
  );
}

export function EditDriverButton({ driver, children }: { driver: DriverDTO; children?: ReactNode }) {
  const { openEdit } = useDriverDialog();
  return (
    <button
      type="button"
      onClick={() => openEdit(driver)}
      className="text-left font-medium text-ink hover:text-brand-700 hover:underline"
      title="Edit driver"
    >
      {children ?? driver.name}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Add driver: step 1 (number check) → step 2 (details)                */
/* ------------------------------------------------------------------ */

function Stepper({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3">
      <StepDot n={1} label="Phone number" state={step === 1 ? "active" : "done"} />
      <span className={`h-0.5 flex-1 rounded ${step === 2 ? "bg-emerald-500" : "bg-line"}`} />
      <StepDot n={2} label="Driver details" state={step === 2 ? "active" : "todo"} />
    </div>
  );
}

function StepDot({ n, label, state }: { n: number; label: string; state: "active" | "done" | "todo" }) {
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

function CreateDriverDialog({
  onClose,
  initialPhone,
  ...shared
}: Shared & { onClose: () => void; initialPhone?: string }) {
  const [phone, setPhone] = useState<PhoneValue>(() => {
    const e164 = initialPhone ? normalizePhone(initialPhone) : null;
    return e164 ? { e164, ...splitE164(e164) } : { e164: null, dial: "995", local: "" };
  });
  const [phase, setPhase] = useState<"phone" | "exists" | "details">("phone");
  const [existing, setExisting] = useState<DriverDTO | null>(null);
  const [confirmedPhone, setConfirmedPhone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, startCheck] = useTransition();
  const [fieldKey, setFieldKey] = useState(0);

  function runCheck() {
    if (!phone.e164) {
      setError("Enter a valid phone number");
      return;
    }
    setError(null);
    startCheck(async () => {
      const res = await checkPhoneAction(phone.e164!);
      if (res.status === "invalid") setError(res.error);
      else if (res.status === "exists") {
        setExisting(res.driver);
        setPhase("exists");
      } else {
        setConfirmedPhone(res.phone);
        setPhase("details");
      }
    });
  }

  if (phase === "details" && confirmedPhone) {
    return (
      <DetailsDialog
        title="Add driver"
        subtitle="Step 2 of 2 — the number is new. Fill in the driver details."
        header={<Stepper step={2} />}
        onClose={onClose}
        onBack={() => setPhase("phone")}
        confirmedPhone={confirmedPhone}
        onDuplicate={(d) => {
          setExisting(d);
          setPhase("exists");
        }}
        {...shared}
      />
    );
  }

  const isDup = phase === "exists" && existing;

  return (
    <Modal
      open
      onClose={onClose}
      title="Add driver"
      subtitle="Step 1 of 2 — first we check that this driver is not already in the database."
      header={<Stepper step={1} />}
      footer={
        <>
          {isDup && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setPhase("phone");
                setExisting(null);
                setPhone({ e164: null, dial: phone.dial, local: "" });
                setFieldKey((k) => k + 1);
              }}
            >
              <ArrowLeft className="size-[18px]" />
              Try another number
            </button>
          )}
          <span className="flex-1" />
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {isDup ? (
            <button type="button" className="btn-primary" disabled>
              Continue
            </button>
          ) : (
            <button type="submit" form="phone-check" className="btn-primary" disabled={checking}>
              <Search className="size-[18px]" />
              {checking ? "Checking…" : "Check number"}
            </button>
          )}
        </>
      }
    >
      <form
        id="phone-check"
        onSubmit={(e) => {
          e.preventDefault();
          runCheck();
        }}
      >
        <PhoneField
          // re-mount to clear after "Try another number"
          key={fieldKey}
          name="phone-check"
          autoFocus
          defaultValue={phone.e164 ?? undefined}
          onValueChange={(v) => {
            setPhone(v);
            setError(null);
            if (phase === "exists") {
              setPhase("phone");
              setExisting(null);
            }
          }}
          status={isDup ? "warning" : error ? "error" : "default"}
          helper={
            isDup
              ? "This number is already registered."
              : (error ?? undefined)
          }
        />
      </form>

      {isDup ? (
        <DuplicateAlert driver={existing} />
      ) : (
        <p className="flex gap-2.5 rounded-[10px] bg-brand-50 px-3.5 py-3 text-[13px] text-brand-700">
          <Info className="mt-px size-[18px] shrink-0 text-brand-600" />
          Paste the number straight from WhatsApp — the country code is detected automatically, so “+995 599 12 34
          56”, “599123456” and “00995599123456” count as the same driver.
        </p>
      )}
    </Modal>
  );
}

export function DuplicateAlert({ driver }: { driver: DriverDTO }) {
  return (
    <div className="space-y-3.5 rounded-xl border border-amber-500 bg-amber-50 px-[18px] pt-4 pb-[18px]">
      <div className="flex gap-2.5">
        <AlertTriangle className="size-5 shrink-0 text-amber-500" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Already in our database</p>
          <p className="mt-0.5 text-[13px] text-amber-800">
            {formatPhone(driver.phone)} was added by logist <b>{driver.logist.name}</b> on{" "}
            {new Date(driver.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}.
            You can’t add it twice.
          </p>
        </div>
      </div>
      <dl className="divide-y divide-line rounded-[10px] border border-line bg-white px-4 py-1.5 text-sm">
        <Row k="Logist">
          <LogistBadge name={driver.logist.name} color={driver.logist.color} full />
        </Row>
        <Row k="Name">
          <span className="font-semibold">{driver.name}</span>
        </Row>
        <Row k="Truck type">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Truck className="size-4 text-ink-2" />
            {driver.truckType}
          </span>
        </Row>
        <Row k="Destination">
          <span className="flex flex-wrap gap-1">
            {driver.destinations.map((d) => (
              <DestinationTag key={d.id} name={d.name} />
            ))}
          </span>
        </Row>
        {driver.description && (
          <Row k="Description">
            <span className="text-[13px]">{driver.description}</span>
          </Row>
        )}
      </dl>
      <div className="flex flex-wrap gap-2.5">
        <a href={`/check?phone=${encodeURIComponent(driver.phone)}`} className="btn-secondary">
          <Eye className="size-[18px]" />
          Open driver card
        </a>
        <a href={whatsappUrl(driver.phone)} target="_blank" rel="noopener noreferrer" className="btn-secondary">
          <WhatsAppIcon className="size-[18px] text-wa" />
          Message on WhatsApp
        </a>
      </div>
    </div>
  );
}

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <dt className="w-[110px] shrink-0 text-[13px] text-ink-2">{k}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 / Edit: driver details form                                  */
/* ------------------------------------------------------------------ */

function DetailsDialog({
  title,
  subtitle,
  header,
  onClose,
  onBack,
  confirmedPhone,
  onDuplicate,
  currentUserId,
  logists,
  destinations,
}: Shared & {
  title: string;
  subtitle: string;
  header?: ReactNode;
  onClose: () => void;
  onBack: () => void;
  confirmedPhone: string;
  onDuplicate: (d: DriverDTO) => void;
}) {
  const [state, action, pending] = useActionState<DriverFormState, FormData>(createDriverAction, undefined);

  useEffect(() => {
    if (state?.ok) onClose();
    else if (state && !state.ok && state.existing) onDuplicate(state.existing);
  }, [state, onClose, onDuplicate]);

  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      header={header}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onBack}>
            <ArrowLeft className="size-[18px]" />
            Back
          </button>
          <span className="flex-1" />
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="driver-form" className="btn-primary" disabled={pending}>
            <Check className="size-[18px]" />
            {pending ? "Saving…" : "Save driver"}
          </button>
        </>
      }
    >
      <div className="flex items-center gap-2.5 rounded-[10px] border border-emerald-500 bg-emerald-50 px-3.5 py-2.5">
        <Check className="size-[18px] text-emerald-500" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-emerald-800">{formatPhone(confirmedPhone)}</p>
          <p className="text-xs font-medium text-emerald-700">New number — not found in the database</p>
        </div>
        <button type="button" onClick={onBack} className="text-[13px] font-medium text-brand-700 hover:underline">
          Change
        </button>
      </div>

      <form id="driver-form" action={action} className="space-y-[18px]">
        <input type="hidden" name="phone" value={confirmedPhone} />
        {state && !state.ok && state.error && !state.existing && <FormError message={state.error} />}
        <DriverFields
          errors={errors}
          currentUserId={currentUserId}
          logists={logists}
          destinations={destinations}
        />
      </form>
    </Modal>
  );
}

function EditDriverDialog({
  driver,
  onClose,
  currentUserId,
  logists,
  destinations,
}: Shared & { driver: DriverDTO; onClose: () => void }) {
  const [state, action, pending] = useActionState<DriverFormState, FormData>(
    updateDriverAction.bind(null, driver.id),
    undefined,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const logistOptions = logists.some((l) => l.id === driver.logist.id) ? logists : [driver.logist, ...logists];

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit driver"
      subtitle={`Added by ${driver.logist.name} on ${new Date(driver.createdAt).toLocaleDateString("en-GB")}`}
      footer={
        confirmDelete ? (
          <>
            <span className="text-sm font-medium text-red-700">Delete {driver.name}? This can’t be undone.</span>
            <span className="flex-1" />
            <button type="button" className="btn-secondary" onClick={() => setConfirmDelete(false)}>
              Keep
            </button>
            <button
              type="button"
              className="btn bg-red-600 text-white hover:bg-red-700"
              disabled={deleting}
              onClick={() =>
                startDelete(async () => {
                  const res = await deleteDriverAction(driver.id);
                  if (res.ok) onClose();
                  else {
                    setDeleteError(res.error ?? "Could not delete");
                    setConfirmDelete(false);
                  }
                })
              }
            >
              {deleting ? "Deleting…" : "Yes, delete"}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn-danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-[18px]" />
              Delete
            </button>
            <span className="flex-1" />
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" form="driver-edit-form" className="btn-primary" disabled={pending}>
              <Check className="size-[18px]" />
              {pending ? "Saving…" : "Save changes"}
            </button>
          </>
        )
      }
    >
      <form id="driver-edit-form" action={action} className="space-y-[18px]">
        {deleteError && <FormError message={deleteError} />}
        {state && !state.ok && state.error && <FormError message={state.error} />}
        {state && !state.ok && state.existing && <DuplicateAlert driver={state.existing} />}
        <PhoneField
          defaultValue={driver.phone}
          status={errors.phone ? "error" : "default"}
          helper={errors.phone}
        />
        <DriverFields
          errors={errors}
          currentUserId={currentUserId}
          logists={logistOptions}
          destinations={destinations}
          defaults={driver}
        />
      </form>
    </Modal>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      {message}
    </p>
  );
}

function DriverFields({
  errors,
  currentUserId,
  logists,
  destinations,
  defaults,
}: Shared & { errors: Partial<Record<string, string>>; defaults?: DriverDTO }) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(defaults?.destinations.map((d) => d.id) ?? []),
  );
  const toggle = (id: number) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const truckOptions =
    defaults && !TRUCK_TYPES.includes(defaults.truckType as (typeof TRUCK_TYPES)[number])
      ? [defaults.truckType, ...TRUCK_TYPES]
      : TRUCK_TYPES;

  return (
    <>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="field-label">
            Full name
          </label>
          <input
            id="name"
            name="name"
            required
            autoFocus={!defaults}
            defaultValue={defaults?.name}
            placeholder="Nika Abashidze"
            className="field"
          />
          <FieldError message={errors.name} />
        </div>
        <div>
          <label htmlFor="truckType" className="field-label">
            Truck type
          </label>
          <div className="relative">
            <Truck className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-ink-3" />
            <select
              id="truckType"
              name="truckType"
              required
              defaultValue={defaults?.truckType ?? ""}
              className="field appearance-none pr-9 pl-10"
            >
              <option value="" disabled>
                Choose…
              </option>
              {truckOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-3" />
          </div>
          <FieldError message={errors.truckType} />
        </div>
      </div>

      <fieldset>
        <div className="mb-2 flex items-center">
          <legend className="text-[13px] font-medium text-ink">Destinations</legend>
          <span className="ml-auto text-xs font-medium text-ink-2">{selected.size} selected</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {destinations.map((d) => {
            const on = selected.has(d.id);
            return (
              <label
                key={d.id}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors select-none ${
                  on
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-line-strong bg-white text-ink hover:bg-subtle"
                }`}
              >
                <input
                  type="checkbox"
                  name="destinationIds"
                  value={d.id}
                  checked={on}
                  onChange={() => toggle(d.id)}
                  className="sr-only"
                />
                {on && <Check className="size-3.5" />}
                {d.name}
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs font-medium text-ink-2">
          A driver can work on several destinations — he will appear in each category.
        </p>
        <FieldError message={errors.destinationIds} />
      </fieldset>

      <div>
        <label htmlFor="description" className="field-label">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={2000}
          defaultValue={defaults?.description ?? ""}
          placeholder="Reefer, 33 pallets. Available from 20 Oct, prefers Batumi port loads."
          className="field resize-y"
        />
        <FieldError message={errors.description} />
      </div>

      <div>
        <label htmlFor="logistId" className="field-label">
          Logist
        </label>
        <div className="relative">
          <select
            id="logistId"
            name="logistId"
            defaultValue={defaults?.logist.id ?? currentUserId}
            className="field appearance-none pr-9"
          >
            {logists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
                {l.id === currentUserId ? " (you)" : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-3" />
        </div>
        <p className="mt-1.5 text-xs font-medium text-ink-2">The logist who owns this contact. Defaults to you.</p>
        <FieldError message={errors.logistId} />
      </div>
    </>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-red-600">{message}</p>;
}
