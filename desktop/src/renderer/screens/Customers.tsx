import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { bridge } from "../bridge";
import { ago, pkr } from "../format";
import { CopyButton, Empty, Fade, Icon } from "../ui/kit";

type C = { contact: string; name: string; phone: string; city: string; orders: number; spent: number; last: string };

export default function Customers({ version, onFindOrders }: { version: number; onFindOrders: (email: string) => void }) {
  const [data, setData] = useState<{ customers: C[] } | null>(null);
  const [term, setTerm] = useState("");
  useEffect(() => { bridge.api("GET", "customers").then((r) => r.ok && setData(r.data)); }, [version]);
  const list = useMemo(() => (data?.customers ?? []).filter((c) => !term || [c.name, c.contact, c.city, c.phone].some((v) => v?.toLowerCase().includes(term.toLowerCase()))), [data, term]);
  const totals = useMemo(() => ({ spent: (data?.customers ?? []).reduce((a, c) => a + c.spent, 0), repeat: (data?.customers ?? []).filter((c) => c.orders > 1).length }), [data]);

  return (
    <div className="flex h-full flex-col px-8 pb-6 pt-7">
      <Fade className="flex items-end justify-between">
        <div>
          <h1 className="text-[30px] font-bold leading-tight tracking-tight">Customers</h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">{data ? `${data.customers.length} people have ordered · ${totals.repeat} came back · ${pkr(totals.spent)} in sales` : "Loading…"}</p>
        </div>
        <label className="relative block w-64">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search people…" type="search"
            className="h-10 w-full rounded-lg bg-white/[0.04] pl-9 pr-3 text-[13px] outline-none ring-1 ring-white/[0.08] focus:ring-2 focus:ring-pink" />
        </label>
      </Fade>
      <Fade i={1} className="card mt-5 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="grid shrink-0 grid-cols-[1.4fr_1.4fr_1fr_90px_120px_100px] gap-4 border-b border-line px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-muted">
          <span>Name</span><span>Email or phone</span><span>Phone · City</span><span className="text-right">Orders</span><span className="text-right">Spent</span><span className="text-right">Last order</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {data && list.length === 0 && <Empty icon="customers" title={term ? "No matches" : "No customers yet"} text={term ? "Try another search." : "Everyone who orders appears here automatically."} />}
          {list.map((c, i) => (
            <motion.div key={c.contact} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 14) * 0.02 } }}
              className="group grid grid-cols-[1.4fr_1.4fr_1fr_90px_120px_100px] items-center gap-4 border-b border-white/[0.035] px-5 py-3 hover:bg-white/[0.025]">
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.06] text-[12px] font-bold">{(c.name || c.contact).slice(0, 1).toUpperCase()}</span>
                <span className="min-w-0"><span className="block truncate font-semibold">{c.name}</span>{c.orders > 1 && <span className="text-[11px] font-semibold text-pink">Came back</span>}</span>
              </span>
              <span className="flex min-w-0 items-center gap-1"><span className="truncate text-ink-body" data-selectable>{c.contact}</span><span className="opacity-0 transition group-hover:opacity-100"><CopyButton text={c.contact} label="Copy" /></span></span>
              <span className="min-w-0 truncate text-[12.5px] text-ink-muted">{c.phone} · {c.city}</span>
              <button type="button" onClick={() => onFindOrders(c.contact)} className="justify-self-end rounded-md px-2 py-1 font-semibold tabular-nums transition hover:bg-white/[0.06] active:scale-95" title="Show their orders">{c.orders}</button>
              <span className="text-right font-semibold tabular-nums">{pkr(c.spent)}</span>
              <span className="text-right text-[12px] text-ink-muted">{ago(c.last)}</span>
            </motion.div>
          ))}
        </div>
      </Fade>
    </div>
  );
}
