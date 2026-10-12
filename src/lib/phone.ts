/**
 * Phone number helpers.
 *
 * Every number is stored as E.164 ("+995599123456"), so the duplicate check
 * treats "+995 599 12 34 56", "599123456" and "00995 599-12-34-56" as the
 * same driver. This file has no server/client dependencies, so it is used by
 * both the browser (smart paste) and the server (validation).
 */

export type Country = {
  iso: string;
  dial: string;
  name: string;
  flag: string;
};

/** Countries offered in the "Code" selector. Order = order in the dropdown. */
export const COUNTRIES: Country[] = [
  { iso: "GE", dial: "995", name: "Georgia", flag: "🇬🇪" },
  { iso: "AZ", dial: "994", name: "Azerbaijan", flag: "🇦🇿" },
  { iso: "AM", dial: "374", name: "Armenia", flag: "🇦🇲" },
  { iso: "TR", dial: "90", name: "Turkey", flag: "🇹🇷" },
  { iso: "RU", dial: "7", name: "Russia / Kazakhstan", flag: "🇷🇺" },
  { iso: "UZ", dial: "998", name: "Uzbekistan", flag: "🇺🇿" },
  { iso: "KG", dial: "996", name: "Kyrgyzstan", flag: "🇰🇬" },
  { iso: "TJ", dial: "992", name: "Tajikistan", flag: "🇹🇯" },
  { iso: "TM", dial: "993", name: "Turkmenistan", flag: "🇹🇲" },
  { iso: "UA", dial: "380", name: "Ukraine", flag: "🇺🇦" },
  { iso: "BY", dial: "375", name: "Belarus", flag: "🇧🇾" },
  { iso: "MD", dial: "373", name: "Moldova", flag: "🇲🇩" },
  { iso: "IR", dial: "98", name: "Iran", flag: "🇮🇷" },
  { iso: "BG", dial: "359", name: "Bulgaria", flag: "🇧🇬" },
  { iso: "RO", dial: "40", name: "Romania", flag: "🇷🇴" },
  { iso: "PL", dial: "48", name: "Poland", flag: "🇵🇱" },
  { iso: "LT", dial: "370", name: "Lithuania", flag: "🇱🇹" },
  { iso: "LV", dial: "371", name: "Latvia", flag: "🇱🇻" },
  { iso: "EE", dial: "372", name: "Estonia", flag: "🇪🇪" },
  { iso: "DE", dial: "49", name: "Germany", flag: "🇩🇪" },
  { iso: "NL", dial: "31", name: "Netherlands", flag: "🇳🇱" },
  { iso: "IT", dial: "39", name: "Italy", flag: "🇮🇹" },
  { iso: "GR", dial: "30", name: "Greece", flag: "🇬🇷" },
];

export const DEFAULT_DIAL = "995";

/** Dial codes sorted longest first, so "+995" wins over "+99" or "+9". */
const DIALS_LONGEST_FIRST = [...new Set(COUNTRIES.map((c) => c.dial))].sort(
  (a, b) => b.length - a.length,
);

export function countryByDial(dial: string): Country | undefined {
  return COUNTRIES.find((c) => c.dial === dial);
}

export type ParsedPhone = {
  /** Country calling code without "+", e.g. "995" */
  dial: string;
  /** National number, digits only, e.g. "599123456" */
  local: string;
  /** true when the code was found inside the pasted/typed text */
  detected: boolean;
};

const MIN_LOCAL = 6;
/** Country code + local number together, e.g. "+995599123456" has 12 digits after the "+". */
const MAX_TOTAL_DIGITS = 16;

/** How many local digits fit after this dial code without exceeding MAX_TOTAL_DIGITS. */
export function maxLocalDigits(dial: string): number {
  return MAX_TOTAL_DIGITS - dial.length;
}

/**
 * Split whatever the user typed or pasted into country code + local number.
 *
 *  "+995 599 12 34 56"  -> { dial: "995", local: "599123456", detected: true }
 *  "00374 91 55 20 18"  -> { dial: "374", local: "91552018",  detected: true }
 *  "995599123456"       -> { dial: "995", local: "599123456", detected: true }
 *  "599 12 34 56"       -> { dial: <currentDial>, local: "599123456", detected: false }
 *  "8 916 123 45 67"    -> { dial: "7",   local: "9161234567", detected: true }  (RU domestic)
 */
export function parsePhone(raw: string, currentDial: string = DEFAULT_DIAL): ParsedPhone {
  let s = (raw ?? "").trim().replace(/[^\d+]/g, "");
  // keep only a leading "+"
  const hasPlus = s.startsWith("+");
  s = s.replace(/\+/g, "");
  let international = hasPlus;
  if (!international && s.startsWith("00")) {
    s = s.slice(2);
    international = true;
  }

  // Russian / Kazakh domestic format: 8 9XX XXX XX XX
  if (!international && s.length === 11 && s.startsWith("8")) {
    return { dial: "7", local: s.slice(1), detected: true };
  }

  // Without "+", only treat it as international when it is clearly too long
  // to be a local number and begins with a known code.
  const looksInternational = international || s.length >= 11;

  if (looksInternational) {
    for (const dial of DIALS_LONGEST_FIRST) {
      if (s.startsWith(dial) && s.length - dial.length >= MIN_LOCAL) {
        return { dial, local: stripTrunkZero(s.slice(dial.length), dial), detected: true };
      }
    }
  }

  return { dial: currentDial, local: stripTrunkZero(s, currentDial), detected: false };
}

/** "0532..." (Turkey) or "067..." (Ukraine) -> drop the domestic trunk 0. Italy keeps it. */
function stripTrunkZero(local: string, dial: string): string {
  if (dial === "39") return local;
  return local.startsWith("0") ? local.replace(/^0+/, "") : local;
}

export function isValidLocal(local: string, dial: string = DEFAULT_DIAL): boolean {
  return /^\d+$/.test(local) && local.length >= MIN_LOCAL && local.length <= maxLocalDigits(dial);
}

export function toE164(dial: string, local: string): string {
  return `+${dial}${local}`;
}

/** Drops digits past maxDigits, keeping any separators (spaces, dashes) typed before the cutoff. */
export function truncateDigits(s: string, maxDigits: number): string {
  let count = 0;
  let out = "";
  for (const ch of s) {
    if (/\d/.test(ch)) {
      count++;
      if (count > maxDigits) break;
    }
    out += ch;
  }
  return out;
}

/**
 * Normalize any input to E.164, or return null if it is not a usable number.
 * Used on the server so the database only ever sees one format.
 */
export function normalizePhone(raw: string, currentDial: string = DEFAULT_DIAL): string | null {
  const { dial, local } = parsePhone(raw, currentDial);
  if (!isValidLocal(local, dial)) return null;
  return toE164(dial, local);
}

/** Split a stored E.164 value back into code + local (for edit forms). */
export function splitE164(e164: string): { dial: string; local: string } {
  const p = parsePhone(e164.startsWith("+") ? e164 : `+${e164}`);
  return { dial: p.dial, local: p.local };
}

/** Countries whose 9-digit mobile numbers are written "XX XXX XX XX". */
const TWO_THREE_TWO_TWO = new Set(["994", "998", "992", "380", "375"]);

/** Group local digits for display: 9 -> "599 12 34 56", 10 -> "916 123 45 67". */
export function formatLocal(local: string, dial?: string): string {
  const d = local.replace(/\D/g, "");
  if (d.length === 9 && dial && TWO_THREE_TWO_TWO.has(dial))
    return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
  if (d.length === 9) return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
  if (d.length === 8) return `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6)}`;
  return d.replace(/(\d{3})(?=\d)/g, "$1 ");
}

/** "+995599123456" -> "+995 599 12 34 56" */
export function formatPhone(e164: string): string {
  const { dial, local } = splitE164(e164);
  return `+${dial} ${formatLocal(local, dial)}`;
}

/** Link that opens a WhatsApp chat with the driver. */
export function whatsappUrl(e164: string): string {
  return `https://wa.me/${e164.replace(/\D/g, "")}`;
}
