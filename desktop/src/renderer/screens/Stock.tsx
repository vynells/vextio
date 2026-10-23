import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { bridge } from "../bridge";
import { Empty, Fade, Icon, Spinner, useToast } from "../ui/kit";

type Product = { id: string; name: string; image_url: string | null; price: string; sizes: Record<string, number> | null };
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const sortSizes = (a: string, b: string) => {
  const i = SIZE_ORDER.indexOf(a), j = SIZE_ORDER.indexOf(b);
  return (i < 0 ? 99 : i) - (j < 0 ? 99 : j) || a.localeCompare(b);
};
const LOW = 2;

type Filter = "all" | "low" | "out";

export default function Stock({ version }: { version: number }) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const toast = useToast();

  useEffect(() => {
    bridge.api<{ products: Product[] }>("GET", "stock").then((r) => {
      if (r.ok) setProducts(r.data.products);
      else toast(r.data.error || "Couldn’t load stock.", "error");
    });
  }, [version, toast]);

  const units = (p: Product) => Object.values(p.sizes ?? {}).reduce((a, n) => a + Number(n || 0), 0);
  const sizesOf = (p: Product) => Object.entries(p.sizes ?? {}).sort(([a], [b]) => sortSizes(a, b));
  const isOut = (p: Product) => sizesOf(p).some(([, n]) => Number(n) === 0);
  const isLow = (p: Product) => sizesOf(p).some(([, n]) => Number(n) > 0 && Number(n) <= LOW);

  const counts = useMemo(() => ({
    all: products?.length ?? 0,
    low: products?.filter(isLow).length ?? 0,
    out: products?.filter(isOut).length ?? 0,
  }), [products]);

  const list = useMemo(() => (products ?? []).filter((p) =>
    (!term || p.name.toLowerCase().includes(term.toLowerCase())) &&
    (filter === "all" || (filter === "low" ? isLow(p) : isOut(p)))
  ), [products, term, filter]);

  const update = (id: string, sizes: Record<string, number>) =>
    setProducts((ps) => ps?.map((p) => (p.id === id ? { ...p, sizes } : p)) ?? ps);

  return (
    <div className="flex h-full flex-col px-8 pb-6 pt-7">
      <Fade className="flex items-end justify-between">
        <div>
          <h1 className="text-[30px] leading-tight">Stock</h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">{products ? `${products.length} products · ${products.reduce((a, p) => a + units(p), 0)} pieces in stock · ${counts.out} with a size sold out` : "Loading…"}</p>
        </div>
        <label className="relative block w-64">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search products…" type="search"
            className="h-10 w-full rounded-lg bg-white/[0.04] pl-9 pr-3 text-[13px] outline-none ring-1 ring-white/[0.08] focus:ring-2 focus:ring-pink" />
        </label>
      </Fade>

      <Fade i={1} className="mt-5 flex gap-0.5 self-start rounded-xl bg-white/[0.03] p-1 ring-1 ring-line" role="tablist">
        {([["all", "All products"], ["low", `Low (≤${LOW})`], ["out", "Sold out sizes"]] as const).map(([k, label]) => (
          <button key={k} role="tab" type="button" aria-selected={filter === k} onClick={() => setFilter(k)}
            className={`relative flex h-8 items-center gap-2 rounded-lg px-3 text-[12.5px] font-semibold transition-colors active:scale-95 ${filter === k ? "text-night" : "text-ink-muted hover:text-ink"}`}>
            {filter === k && <motion.span layoutId="stock-filter" className="absolute inset-0 rounded-lg bg-paper" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            <span className="relative">{label}</span>
            <span className={`relative rounded px-1.5 text-[11px] tabular-nums ${filter === k ? "bg-night/10" : "bg-white/[0.06]"}`}>{counts[k]}</span>
          </button>
        ))}
      </Fade>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {!products ? (
          <div className="grid grid-cols-2 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-32 animate-pulse" />)}</div>
        ) : list.length === 0 ? (
          <div className="card"><Empty icon="tag" title={term || filter !== "all" ? "Nothing here" : "No products yet"} text={term || filter !== "all" ? "Try another search or filter." : "Add products in the website’s admin page and they appear here."} /></div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(420px,1fr))] gap-3 pb-2">
            {list.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 12) * 0.025 } }} className="card flex gap-4 p-4">
                {p.image_url
                  ? <img src={p.image_url} alt="" className="h-24 w-20 shrink-0 rounded-md object-cover ring-1 ring-line" />
                  : <span className="grid h-24 w-20 shrink-0 place-items-center rounded-md bg-white/[0.04] text-ink-muted ring-1 ring-line"><Icon name="tag" className="h-6 w-6" /></span>}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-[14.5px] font-semibold">{p.name}</p>
                    <p className="shrink-0 text-[12.5px] tabular-nums text-ink-muted">{p.price} · {units(p)} left</p>
                  </div>
                  {sizesOf(p).length === 0
                    ? <p className="mt-3 text-[12.5px] text-ink-muted">This product has no sizes, so stock isn’t tracked.</p>
                    : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {sizesOf(p).map(([size, qty]) => <SizeBox key={size} product={p} size={size} qty={Number(qty)} onSaved={(sizes) => update(p.id, sizes)} />)}
                      </div>
                    )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SizeBox({ product, size, qty, onSaved }: { product: Product; size: string; qty: number; onSaved: (sizes: Record<string, number>) => void }) {
  const [value, setValue] = useState(String(qty));
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useEffect(() => setValue(String(qty)), [qty]);

  const save = async (next: number) => {
    if (!Number.isFinite(next) || next < 0) { setValue(String(qty)); return; }
    if (next === qty) { setValue(String(qty)); return; }
    setBusy(true);
    const r = await bridge.api<{ sizes: Record<string, number> }>("POST", "stock", { productId: product.id, size, qty: next });
    setBusy(false);
    if (r.ok) { onSaved(r.data.sizes); toast(r.data.ok || "Saved."); }
    else { setValue(String(qty)); toast(r.data.error || "Couldn’t save.", "error"); }
  };

  const n = Number(value);
  const tone = qty === 0 ? "ring-coral/50 bg-coral/[0.07]" : qty <= LOW ? "ring-ochre/50 bg-ochre/[0.06]" : "ring-line bg-white/[0.02]";
  return (
    <div className={`flex items-center rounded-lg ring-1 ${tone}`}>
      <span className="w-11 pl-2.5 text-[12px] font-bold">{size}</span>
      <button type="button" aria-label={`One less ${size}`} disabled={busy || qty === 0} onClick={() => save(qty - 1)} className="grid h-8 w-7 place-items-center text-ink-muted transition hover:text-ink active:scale-90 disabled:opacity-40"><Icon name="minus" className="h-3.5 w-3.5" /></button>
      <input value={value} inputMode="numeric" aria-label={`${product.name} size ${size} stock`}
        onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={() => save(Math.round(n))}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") { setValue(String(qty)); (e.target as HTMLInputElement).blur(); } }}
        className="h-8 w-10 bg-transparent text-center text-[13px] font-semibold tabular-nums outline-none" />
      <button type="button" aria-label={`One more ${size}`} disabled={busy} onClick={() => save(qty + 1)} className="grid h-8 w-7 place-items-center text-ink-muted transition hover:text-ink active:scale-90 disabled:opacity-40">
        {busy ? <Spinner className="h-3 w-3" /> : <Icon name="plus" className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
