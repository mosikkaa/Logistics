import { AVATAR_COLORS, initials } from "@/lib/constants";

export function Avatar({ name, color, size = 28 }: { name: string; color: string; size?: number }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
        AVATAR_COLORS[color] ?? AVATAR_COLORS.blue
      }`}
      style={{ width: size, height: size, fontSize: size >= 48 ? 18 : 12 }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function DestinationTag({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
      {name}
    </span>
  );
}
