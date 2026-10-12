import { shortName } from "@/lib/constants";
import { Avatar } from "@/components/atoms/avatar";

export function LogistBadge({ name, color, full = false }: { name: string; color: string; full?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2" title={name}>
      <Avatar name={name} color={color} />
      <span className="truncate text-[13px] font-medium text-ink">{full ? name : shortName(name)}</span>
    </span>
  );
}
