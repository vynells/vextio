import type { ReactNode } from "react";

// Page-top title block shared by inner pages: big condensed title, one serif sentence.
export function PageHead({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="wrap pb-20 pt-12 sm:pb-28 sm:pt-20">
      <h1 data-reveal className="max-w-[14ch] text-giant">{title}</h1>
      <p data-reveal style={{ ["--d" as string]: 1 }} className="mt-8 max-w-[46ch] text-lead">{children}</p>
    </section>
  );
}

// A slip of paper with a zig-zag tear along the bottom.
export function Slip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`on-paper edge-zig bg-paper px-6 pt-8 text-green sm:px-8 ${className}`}>{children}</div>;
}

// One receipt row: label, dot leader, value.
export function Row({ label, value, strong }: { label: ReactNode; value: ReactNode; strong?: boolean }) {
  return (
    <div className={`tnum flex items-end py-1.5 ${strong ? "font-medium" : ""}`}>
      <span className="min-w-0">{label}</span>
      <span className="leader" aria-hidden />
      <span className="shrink-0 text-right">{value}</span>
    </div>
  );
}

// The inverted last line of a receipt.
export function Total({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="tnum -mx-6 mt-6 flex min-h-[48px] items-center justify-between gap-4 bg-green px-6 py-2 text-paper sm:-mx-8 sm:px-8">
      <span>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
