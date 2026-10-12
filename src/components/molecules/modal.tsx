"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/** Centered dialog with dimmed backdrop. Closes on Esc and backdrop click. */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  header,
  width = 580,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  width?: number;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-sidebar/55 p-4 sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="my-8 w-full overflow-hidden rounded-[18px] bg-white shadow-[0_24px_56px_rgba(10,18,38,0.24)]"
        style={{ maxWidth: width }}
      >
        <div className="border-b border-line px-7 pt-6 pb-5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-ink">{title}</h2>
              {subtitle && <p className="mt-1 text-[13px] text-ink-2">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-8 items-center justify-center rounded-lg text-ink-2 hover:bg-subtle"
              aria-label="Close"
            >
              <X className="size-[18px]" />
            </button>
          </div>
          {header && <div className="mt-[18px]">{header}</div>}
        </div>
        <div className="space-y-[18px] px-7 py-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center gap-3 border-t border-line bg-subtle px-7 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
