import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { pkr, total } from "../format";
import type { Order } from "../status";
import { Badge, ease, Icon, type IconName } from "./kit";
import type { Screen } from "./Sidebar";

type Item = { id: string; label: string; sub?: string; icon?: IconName; order?: Order; run: () => void };

/** Ctrl+K: jump to any order, person or screen by typing. */
export default function Palette({ open, seed = "", onClose, orders, go, openOrder }: { open: boolean; seed?: string; onClose: () => void; orders: Order[]; go: (s: Screen) => void; openOrder: (n: string) => void }) {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) { setQ(seed); setI(0); setTimeout(() => input.current?.focus(), 30); } }, [open, seed]);

  const items = useMemo<Item[]>(() => {
    const t = q.trim().toLowerCase();
    const all: Item[] = [
      { id: "s-o", label: "Go to Orders", icon: "orders", run: () => go("orders") },
      { id: "s-c", label: "Go to Customers", icon: "customers", run: () => go("customers") },
      { id: "s-p", label: "Go to Products", icon: "store", run: () => go("products") },
      { id: "s-t", label: "Go to Stock", icon: "tag", run: () => go("stock") },
      { id: "s-h", label: "Go to Support", icon: "inbox", run: () => go("support") },
      { id: "s-s", label: "Go to Settings", icon: "settings", run: () => go("settings") },
    ];
    const screens = all.filter((s) => !t || s.label.toLowerCase().includes(t));
    const hits = orders
      .filter((o) => !t || [o.number, o.name, o.contact, o.city, o.summary, o.phone].some((v) => v?.toLowerCase().includes(t)))
      .slice(0, 8)
      .map((o) => ({ id: o.number, label: o.number, sub: `${o.name} · ${o.summary} · ${pkr(total(o))}`, order: o, run: () => openOrder(o.number) }));
    return t ? [...hits, ...screens] : [...screens, ...hits];
  }, [q, orders, go, openOrder]);
  useEffect(() => setI(0), [q]);

  const pick = (it?: Item) => { if (!it) return; onClose(); it.run(); };
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] flex justify-center bg-black/50 pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onMouseDown={onClose}>
          <motion.div role="dialog" aria-label="Search" className="h-fit w-[560px] overflow-hidden rounded-2xl bg-raised shadow-pop ring-1 ring-white/[0.1]"
            initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.2, ease }} onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Icon name="search" className="h-4 w-4 text-ink-muted" />
              <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search orders, names, cities… or jump to a screen"
                className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-muted"
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(items.length - 1, x + 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
                  else if (e.key === "Enter") pick(items[i]);
                  else if (e.key === "Escape") onClose();
                }} />
              <span className="kbd">Esc</span>
            </div>
            <ul className="max-h-[380px] overflow-y-auto p-2">
              {items.length === 0 && <li className="px-3 py-8 text-center text-[13px] text-ink-muted">Nothing matches “{q}”.</li>}
              {items.map((it, k) => (
                <li key={it.id}>
                  <button type="button" onMouseMove={() => setI(k)} onClick={() => pick(it)}
                    className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${k === i ? "bg-white/[0.07]" : ""}`}>
                    {it.order ? <span className="w-28 font-mono text-[12.5px] font-semibold">{it.label}</span> : <span className="grid h-7 w-7 place-items-center rounded-md bg-white/[0.05] text-ink-muted"><Icon name={it.icon!} className="h-4 w-4" /></span>}
                    <span className="min-w-0 flex-1 truncate text-[13px]">{it.order ? <span className="text-ink-body">{it.sub}</span> : it.label}</span>
                    {it.order && <Badge status={it.order.status} />}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
