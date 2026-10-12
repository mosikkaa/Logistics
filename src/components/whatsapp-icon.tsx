export function WhatsAppIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 2.6a9.4 9.4 0 0 0-8.1 14.2L2.6 21.4l4.7-1.2A9.4 9.4 0 1 0 12 2.6z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M8.7 7.5c.2-.4.5-.4.7-.4h.5c.2 0 .4 0 .5.4l.8 1.9c.1.2.1.4 0 .6l-.5.7c-.1.2-.1.3 0 .5.5.9 1.3 1.7 2.2 2.2.2.1.4.1.5 0l.7-.8c.2-.2.4-.2.6-.1l1.9.9c.2.1.3.3.3.5 0 .6-.3 1.3-.8 1.6-.6.4-1.4.5-2.1.3-1.4-.4-2.7-1.2-3.8-2.3-1-1-1.8-2.2-2.2-3.5-.2-.8 0-1.6.5-2.5z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Green square button from the design — opens a chat in WhatsApp. */
export function WhatsAppButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={label}
      className="inline-flex size-[34px] items-center justify-center rounded-[9px] bg-wa text-white transition-colors hover:bg-wa-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-wa/30"
    >
      <WhatsAppIcon className="size-5" />
    </a>
  );
}
