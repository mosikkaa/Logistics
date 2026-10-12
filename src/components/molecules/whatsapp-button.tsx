import { WhatsAppIcon } from "@/components/atoms/whatsapp-icon";

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
