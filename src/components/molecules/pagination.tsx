import Link from "next/link";

export function Pagination({ page, pageCount, hrefFor }: { page: number; pageCount: number; hrefFor: (p: number) => string }) {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  const items: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1]! > 1) items.push("…");
    items.push(p);
  });
  const base = "inline-flex size-[34px] items-center justify-center rounded-lg text-[13px] font-medium";
  return (
    <div className="flex items-center gap-1.5 border-t border-line px-5 py-3.5">
      <p className="mr-auto text-[13px] text-ink-2">
        Page {page} of {pageCount}
      </p>
      {page > 1 && (
        <Link href={hrefFor(page - 1)} className={`${base} border border-line bg-white text-ink-2`} aria-label="Previous page">
          ‹
        </Link>
      )}
      {items.map((it, i) =>
        it === "…" ? (
          <span key={`e${i}`} className={`${base} text-ink-2`}>
            …
          </span>
        ) : (
          <Link
            key={it}
            href={hrefFor(it)}
            className={`${base} ${it === page ? "bg-brand-50 text-brand-700" : "border border-line bg-white text-ink"}`}
          >
            {it}
          </Link>
        ),
      )}
      {page < pageCount && (
        <Link href={hrefFor(page + 1)} className={`${base} border border-line bg-white text-ink-2`} aria-label="Next page">
          ›
        </Link>
      )}
    </div>
  );
}
