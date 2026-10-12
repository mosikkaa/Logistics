/**
 * Import drivers from an Excel sheet (e.g. the "luka" sheet of mtavari_baza.xlsx).
 *
 *   npm run import:drivers -- "C:\path\mtavari_baza.xlsx" --sheet luka
 *   (drivers go to the admin account; use --logist <email> for someone else)
 *   add --dry-run to only see the report without saving anything
 *
 * Expected columns (first row is a header):
 *   A: number   B: name   C: truck   D… : destinations (one or more cells)
 *
 * - Phone numbers are normalized like in the app (599123456 -> +995599123456).
 * - Numbers already in the database are skipped; numbers repeated in the sheet are merged.
 * - Georgian destination words are mapped to the destination tabs; anything that can't be
 *   mapped (notes in brackets, "ისვენებს", company names…) is kept in the description.
 * - A report CSV is written next to the Excel file.
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { normalizePhone } from "../src/lib/phone";

/* ---------------- arguments ---------------- */

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const sheetName = opt("sheet") ?? "luka";
const logistEmail = opt("logist")?.toLowerCase(); // default: the admin account
const dryRun = args.includes("--dry-run");

if (!file) {
  console.error('Usage: npm run import:drivers -- "path/to/file.xlsx" [--sheet luka] [--logist email] [--dry-run]');
  process.exit(1);
}

/* ---------------- mapping rules ---------------- */

const DESTINATIONS: { code: string; name: string; words: string[] }[] = [
  { code: "GE", name: "Georgia", words: ["საქართველ", "ფოთ", "ბათუმ", "თბილის"] },
  { code: "TR", name: "Turkey", words: ["თურქეთ", "ტურქეთ", "turqet"] },
  { code: "RU", name: "Russia", words: ["რუსეთ", "ვლადიკავკაზ", "მოსკოვ"] },
  { code: "AM", name: "Armenia", words: ["სომხეთ", "ერევან", "erevan"] },
  { code: "AZ", name: "Azerbaijan", words: ["აზერბაიჯან", "ბაქო"] },
  { code: "KZ", name: "Kazakhstan", words: ["ყაზახეთ"] },
  { code: "BY", name: "Belarus", words: ["ბელარუს", "ბელორუს", "ბელაურის"] },
  { code: "CA", name: "Central Asia", words: ["აზია", "შუააზი", "შუა"] },
  { code: "EU", name: "Europe", words: ["ევროპ", "ფინეთ"] },
  { code: "CN", name: "China", words: ["ჩინეთ"] },
  { code: "ALL", name: "All directions", words: ["ყველა", "ყველგან"] },
];

/** Words that are not destinations but are fine to drop when they stand alone. */
const NOISE = /^(მიმართულ.*|მხოლოდ|იანი|და|;|,|-)$/u;

function mapDestinations(cells: string[]) {
  const codes = new Set<string>();
  const notes: string[] = [];
  for (const raw of cells) {
    // text in brackets is a note: "თურქეთი(ისვენებს)" -> destination თურქეთი, note "ისვენებს"
    for (const m of raw.matchAll(/\(([^)]*)\)/g)) if (m[1]!.trim()) notes.push(m[1]!.trim());
    const main = raw.replace(/\([^)]*\)/g, " ").trim();
    if (!main) continue;
    let matched = false;
    // "ყველამიმართულება" contains "შუა"? no; but check ALL first so "ყველა…" isn't split oddly
    const sorted = [...DESTINATIONS].sort((a, b) => (a.code === "ALL" ? -1 : b.code === "ALL" ? 1 : 0));
    let rest = main;
    for (const d of sorted) {
      for (const w of d.words) {
        if (rest.toLowerCase().includes(w)) {
          codes.add(d.code);
          matched = true;
          rest = rest.toLowerCase().split(w).join(" ");
        }
      }
    }
    // keep leftovers that look meaningful ("ხორბალზე", "მეპატრონე", "105იანი"…)
    const leftover = rest
      .replace(/[;,]/g, " ")
      .split(/\s+/)
      .map((t) => t.replace(/^(ი|ის|ში|ში|იც|იდან|ით)$/, ""))
      .filter((t) => t.length > 2 && !NOISE.test(t));
    if (!matched || leftover.length) notes.push(matched ? leftover.join(" ") : main);
  }
  return { codes: [...codes], notes: notes.filter(Boolean) };
}

function mapTruck(raw: string): { truckType: string; note?: string } {
  const t = raw.replace(/\s+/g, "");
  if (!t) return { truckType: "Other" };
  const tent = /ტენტ/.test(t);
  const ref = /რეფ/.test(t);
  const type = tent && ref ? "Tent / Ref" : tent ? "Tent" : ref ? "Ref" : "Other";
  // keep anything more than the plain word ("2ტენტი", "ტენტი105", "რაღაცა") as a note
  const plain = ["ტენტი", "რეფი", "ტენტი/რეფი", "რეფი/ტენტი"];
  return { truckType: type, note: plain.includes(t) ? undefined : `მანქანა: ${raw.trim()}` };
}

/* ---------------- read sheet ---------------- */

type Row = { line: number; phone: string; name: string; truckType: string; codes: string[]; notes: string[] };

async function readRows() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file!);
  const ws = wb.getWorksheet(sheetName);
  if (!ws) {
    throw new Error(`Sheet "${sheetName}" not found. Sheets: ${wb.worksheets.map((w) => w.name).join(", ")}`);
  }
  const text = (v: ExcelJS.CellValue) =>
    v == null ? "" : typeof v === "object" && "text" in v ? String(v.text) : String(v).trim();

  const rows: Row[] = [];
  const skipped: { line: number; reason: string; raw: string }[] = [];
  ws.eachRow((r, line) => {
    if (line === 1) return; // header
    const cells = (r.values as ExcelJS.CellValue[]).slice(1).map(text);
    if (!cells.some(Boolean)) return;
    const [rawPhone = "", rawName = "", rawTruck = "", ...rawDest] = cells;
    const phone = normalizePhone(rawPhone, "995");
    if (!phone) {
      skipped.push({ line, reason: "invalid phone number", raw: cells.join(" | ") });
      return;
    }
    // a destination written in the truck column ("თურქეთი") -> treat as destination
    const truckIsPlace = rawTruck && !/ტენტ|რეფ/.test(rawTruck) && mapDestinations([rawTruck]).codes.length > 0;
    const truck = truckIsPlace ? { truckType: "Other" } : mapTruck(rawTruck);
    const dest = mapDestinations([...(truckIsPlace ? [rawTruck] : []), ...rawDest.filter(Boolean)]);
    const notes = [...(truck.note ? [truck.note] : []), ...dest.notes];
    rows.push({ line, phone, name: rawName.trim(), truckType: truck.truckType, codes: dest.codes, notes });
  });
  return { rows, skipped };
}

/** Same number several times in the sheet -> one driver with everything combined. */
function mergeDuplicates(rows: Row[]) {
  const byPhone = new Map<string, Row & { lines: number[] }>();
  for (const r of rows) {
    const cur = byPhone.get(r.phone);
    if (!cur) {
      byPhone.set(r.phone, { ...r, lines: [r.line] });
      continue;
    }
    cur.lines.push(r.line);
    if (!cur.name && r.name) cur.name = r.name;
    else if (r.name && r.name !== cur.name) cur.notes.push(`სახელი ასევე: ${r.name}`);
    if (cur.truckType === "Other" && r.truckType !== "Other") cur.truckType = r.truckType;
    else if (r.truckType !== cur.truckType && r.truckType !== "Other" && cur.truckType !== "Tent / Refrigerator")
      cur.truckType = "Tent / Refrigerator";
    cur.codes = [...new Set([...cur.codes, ...r.codes])];
    cur.notes = [...new Set([...cur.notes, ...r.notes])];
  }
  return [...byPhone.values()];
}

/* ---------------- main ---------------- */

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("Set DATABASE_URL / DIRECT_URL in .env");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  try {
    const logist = logistEmail
      ? await db.user.findUnique({ where: { email: logistEmail } })
      : await db.user.findFirst({ where: { role: "ADMIN" }, orderBy: { id: "asc" } });
    if (!logist) throw new Error(logistEmail ? `No logist with email "${logistEmail}".` : "No admin account — run npm run db:seed first.");

    const { rows, skipped } = await readRows();
    const drivers = mergeDuplicates(rows);

    // make sure every destination tab exists
    const existing = await db.destination.findMany();
    const maxOrder = Math.max(-1, ...existing.map((d) => d.sortOrder));
    const destId = new Map(existing.map((d) => [d.code, d.id]));
    let order = maxOrder;
    for (const d of DESTINATIONS) {
      if (destId.has(d.code)) continue;
      if (dryRun) {
        destId.set(d.code, -1);
        continue;
      }
      const created = await db.destination.create({ data: { code: d.code, name: d.name, sortOrder: ++order } });
      destId.set(d.code, created.id);
      console.log(`+ destination ${d.name}`);
    }

    const already = new Map(
      (
        await db.driver.findMany({
          where: { phone: { in: drivers.map((d) => d.phone) } },
          select: { phone: true, logist: { select: { name: true } } },
        })
      ).map((d) => [d.phone, d.logist.name]),
    );

    const report: string[][] = [["status", "excel rows", "phone", "name", "truck", "destinations", "note"]];
    let added = 0;
    for (const d of drivers) {
      const lines = d.lines.join(" ");
      const destNames = d.codes.map((c) => DESTINATIONS.find((x) => x.code === c)?.name ?? c).join(", ");
      const description = d.notes.join("; ").slice(0, 2000) || null;
      if (already.has(d.phone)) {
        report.push(["skipped: already in database", lines, d.phone, d.name, d.truckType, destNames, `logist ${already.get(d.phone)}`]);
        continue;
      }
      if (!dryRun) {
        await db.driver.create({
          data: {
            phone: d.phone,
            name: d.name || "უცნობი",
            truckType: d.truckType,
            description,
            logistId: logist.id,
            destinations: { connect: d.codes.map((c) => ({ id: destId.get(c)! })) },
          },
        });
      }
      added++;
      const flags = [
        d.lines.length > 1 ? `merged ${d.lines.length} rows` : "",
        !d.name ? "no name" : "",
        !d.codes.length ? "no destination" : "",
      ].filter(Boolean);
      report.push([flags.length ? `added (${flags.join(", ")})` : "added", lines, d.phone, d.name || "უცნობი", d.truckType, destNames, description ?? ""]);
    }
    for (const s of skipped) report.push([`skipped: ${s.reason}`, String(s.line), "", "", "", "", s.raw]);

    const reportPath = path.join(path.dirname(file!), `import-report-${sheetName}.csv`);
    const csv = report.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    writeFileSync(reportPath, "\uFEFF" + csv); // BOM so Excel shows Georgian correctly

    console.log(`\n${dryRun ? "DRY RUN — nothing saved.\n" : ""}Sheet "${sheetName}" → logist ${logist.name}`);
    console.log(`  rows read:            ${rows.length + skipped.length}`);
    console.log(`  drivers ${dryRun ? "to add" : "added"}:        ${added}`);
    console.log(`  merged duplicates:    ${rows.length - drivers.length}`);
    console.log(`  already in database:  ${[...already.keys()].length}`);
    console.log(`  invalid numbers:      ${skipped.length}`);
    console.log(`  report:               ${reportPath}\n`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
