import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Me } from "../bridge";
import { ago, first, greeting, pkr, total, when } from "../format";
import { needsAction, type Order, type Status } from "../status";
import { Badge, Empty, Fade, Icon, useKey } from "../ui/kit";

export type Filter = "action" | "shipped" | "delivered" | "cancelled" | "all";
const FILTERS: { k: Filter; label: string; match: (s: Status) => boolean }[] = [
  { k: "action", label: "Needs action", match: needsAction },
  { k: "shipped", label: "Shipped", match: (s) => s === "shipped" },
  { k: "delivered", label: "Delivered", match: (s) => s === "delivered" },
  { k: "cancelled", label: "Cancelled & returned", match: (s) => s === "cancelled" || s === "returned" },
  { k: "all", label: "All orders", match: () => true },
];

export default function Orders({ me, orders, loaded, filter, setFilter, selected, open }: {
  me: Me | null; orders: Order[]; loaded: boolean; filter: Filter; setFilter: (f: Filter) => void; selected: string | null; open: (n: string) => void;
}) {
  const [term, setTerm] = useState("");
  const [cursor, setCursor] = useState(0);
  const search = useRef<HTMLInputElement>(null);
  useKey("mod+f", (e) => { e.preventDefault(); search.current?.focus(); });

  const count = (...s: Status[]) => orders.filter((o) => s.includes(o.status)).length;
  const collected = orders.filter((o) => ["processing", "shipped", "delivered"].includes(o.status)).reduce((a, o) => a + total(o), 0);
  const today = orders.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString()).length;
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.k, orders.filter((o) => f.match(o.status)).length])) as Record<Filter, number>, [orders]);
  const list = useMemo(() => {
    const m = FILTERS.find((f) => f.k === filter)!.match;
    const t = term.trim().toLowerCase();
    return orders.filter((o) => m(o.status) && (!t || [o.number, o.name, o.contact, o.city, o.summary, o.phone].some((v) => v?.toLowerCase().includes(t))));
  }, [orders, filter, term]);
  useEffect(() => setCursor(0), [filter, term]);

  // Arrow keys move through the list, Enter opens the order.
  useKey("arrowdown", (e) => { if (isTyping(e) && e.target !== search.current) return; e.preventDefault(); setCursor((c) => Math.min(list.length - 1, c + 1)); }, [list]);
  useKey("arrowup", (e) => { if (isTyping(e) && e.target !== search.current) return; e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }, [list]);
  useKey("enter", (e) => { if (isTyping(e) && e.target !== search.current) return; if (list[cursor]) open(list[cursor].number); }, [list, cursor]);
  useEffect(() => { document.getElementById(`row-${cursor}`)?.scrollIntoView({ block: "nearest" }); }, [cursor]);

  const stats = [
    { label: "Verify payment", value: String(count("pending")), hot: count("pending") > 0, f: "action" as Filter, sub: "Card, bank and Easypaisa orders" },
    { label: "To ship", value: String(count("processing")), hot: count("processing") > 0, f: "action" as Filter, sub: "COD and paid, waiting for the courier" },
    { label: "On the way", value: String(count("shipped")), f: "shipped" as Filter, sub: "With the courier" },
    { label: "Sales", value: pkr(collected), f: "all" as Filter, sub: `${count("processing", "shipped", "delivered")} orders · ${today} new today` },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-8 pt-7">
        <Fade>
          <p className="text-[12.5px] text-ink-muted">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Karachi" })}</p>
          <h1 className="mt-0.5 text-[30px] font-bold leading-tight tracking-tight">{greeting()}{me?.name ? `, ${first(me.name)}` : ""}.</h1>
        </Fade>
        <div className="mt-5 grid grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <Fade key={s.label} i={i + 1}>
              <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => setFilter(s.f)}
                className={`card group relative w-full overflow-hidden p-4 text-left transition-colors hover:bg-raised ${s.hot ? "ring-pink/35" : ""}`}>
                {s.hot && <span className="absolute right-3 top-3 h-2 w-2 animate-pulse rounded-full bg-pink" />}
                <p className="text-[12px] font-semibold text-ink-muted">{s.label}</p>
                <p className="mt-1.5 font-display text-[26px] font-bold tabular-nums leading-none">{s.value}</p>
                <p className="mt-2 truncate text-[11.5px] text-ink-muted">{s.sub}</p>
              </motion.button>
            </Fade>
          ))}
        </div>

        <Fade i={5} className="mt-6 flex items-center gap-3">
          <div role="tablist" className="flex gap-0.5 rounded-xl bg-white/[0.03] p-1 ring-1 ring-line">
            {FILTERS.map((f) => (
              <button key={f.k} role="tab" type="button" aria-selected={filter === f.k} onClick={() => setFilter(f.k)}
                className={`relative flex h-8 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-[12.5px] font-semibold transition-colors active:scale-95 ${filter === f.k ? "text-night" : "text-ink-muted hover:text-ink"}`}>
                {filter === f.k && <motion.span layoutId="filter" className="absolute inset-0 rounded-lg bg-paper" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                <span className="relative">{f.label}</span>
                <span className={`relative rounded px-1.5 text-[11px] tabular-nums ${filter === f.k ? "bg-night/10" : "bg-white/[0.06]"}`}>{counts[f.k]}</span>
              </button>
            ))}
          </div>
          <label className="relative ml-auto block w-64">
            <span className="sr-only">Search orders</span>
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input ref={search} value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search…  Ctrl F" type="search"
              className="h-10 w-full rounded-lg bg-white/[0.04] pl-9 pr-3 text-[13px] outline-none ring-1 ring-white/[0.08] transition placeholder:text-ink-muted/80 focus:ring-2 focus:ring-pink" />
          </label>
        </Fade>
      </div>

      <Fade i={6} className="card mx-8 mb-6 mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="grid shrink-0 grid-cols-[130px_1.2fr_1.6fr_110px_150px_100px] gap-4 border-b border-line px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-muted">
          <span>Order</span><span>Customer</span><span>Items</span><span className="text-right">Total</span><span>Status</span><span className="text-right">Placed</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {!loaded ? <Skeleton /> : list.length === 0 ? (
            <Empty title={orders.length ? (term ? "No matches" : "All caught up") : "No orders yet"}
              text={orders.length ? (term ? "Try a different search." : "Nothing here right now. Nice work.") : "When someone orders on the Vextio website, it appears here and you’ll get a notification."} />
          ) : (
            <AnimatePresence initial={false}>
              {list.map((o, i) => {
                const active = selected === o.number, focused = i === cursor;
                return (
                  <motion.button key={o.number} id={`row-${i}`} type="button" layout="position"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 14) * 0.02 } }} exit={{ opacity: 0 }}
                    whileTap={{ scale: 0.992 }} onClick={() => { setCursor(i); open(o.number); }}
                    className={`relative grid w-full grid-cols-[130px_1.2fr_1.6fr_110px_150px_100px] items-center gap-4 border-b border-white/[0.035] px-5 py-3 text-left transition-colors ${active ? "bg-pink/[0.07]" : focused ? "bg-white/[0.035]" : "hover:bg-white/[0.025]"}`}>
                    {active && <motion.span layoutId="row-mark" className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-pink" />}
                    <span className="font-mono text-[12.5px] font-semibold tracking-tight">{o.number}</span>
                    <span className="min-w-0"><span className="block truncate font-semibold">{o.name}</span><span className="block truncate text-[12px] text-ink-muted">{o.city}</span></span>
                    <span className="flex min-w-0 items-center gap-2">
                      {o.items[0]?.imageUrl && <img src={o.items[0].imageUrl} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover ring-1 ring-line" />}
                      <span className="min-w-0 truncate text-[13px] text-ink-body">{o.summary}</span>
                    </span>
                    <span className="text-right font-semibold tabular-nums">{pkr(total(o))}</span>
                    <span><Badge status={o.status} /></span>
                    <span className="text-right text-[12px] text-ink-muted" title={when(o.created_at)}>{ago(o.created_at)}</span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-4 border-t border-line px-5 py-2 text-[11.5px] text-ink-muted">
          <span>{list.length} of {orders.length} orders</span>
          <span className="ml-auto flex items-center gap-1.5"><span className="kbd">↑</span><span className="kbd">↓</span> move <span className="kbd ml-2">Enter</span> open <span className="kbd ml-2">Esc</span> close</span>
        </div>
      </Fade>
    </div>
  );
}

const isTyping = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement;
  return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable || !!t.closest("[role=dialog]"));
};

function Skeleton() {
  return (
    <div className="space-y-px">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[130px_1.2fr_1.6fr_110px_150px_100px] gap-4 px-5 py-4">
          {[70, 60, 70, 50, 60, 40].map((w, j) => <span key={j} className="h-3 animate-pulse rounded bg-white/[0.05]" style={{ width: `${w}%`, animationDelay: `${i * 60}ms` }} />)}
        </div>
      ))}
    </div>
  );
}
