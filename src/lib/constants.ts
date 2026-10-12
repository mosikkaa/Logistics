/** Truck types offered in forms and filters. */
export const TRUCK_TYPES = [
  "Tent",
  "Refrigerator",
  "Tent / Refrigerator",
  "Tilt",
  "Mega trailer",
  "Flatbed",
  "Container 20ft",
  "Container 40ft",
  "Car carrier",
  "Tanker",
  "Van / small truck",
  "Other",
] as const;

/** Avatar colors for logists (keys stored in User.color). */
export const AVATAR_COLORS: Record<string, string> = {
  blue: "bg-brand-50 text-brand-700",
  rose: "bg-rose-100 text-rose-700",
  amber: "bg-amber-100 text-amber-700",
  violet: "bg-violet-100 text-violet-700",
  green: "bg-emerald-100 text-emerald-700",
  slate: "bg-slate-200 text-slate-700",
};

export const PAGE_SIZE = 20;

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/** "Luka Meskhi" -> "Luka M." */
export function shortName(name: string): string {
  const [first, ...rest] = name.trim().split(/\s+/);
  return rest.length ? `${first} ${rest[rest.length - 1]![0]}.` : first ?? name;
}
