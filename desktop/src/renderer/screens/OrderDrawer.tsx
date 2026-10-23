import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { bridge } from "../bridge";
import { first, pkr, total, when } from "../format";
import { isCod, STATUSES, statusInfo, type Order, type OrderEvent, type Status } from "../status";
import { Area, Badge, Button, Check, CopyButton, ease, Field, Icon, Spinner, useKey, useToast } from "../ui/kit";

type Detail = { order: Order; events: OrderEvent[]; previous: number; trackingPage: string; mail: boolean };

export default function OrderDrawer({ number, onClose, onChanged }: { number: string | null; onClose: () => void; onChanged: () => void }) {
  return (
    <AnimatePresence>
      {number && (
        <>
          <motion.div key="dim" className="absolute inset-0 z-30 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside key="panel" role="dialog" aria-label={`Order ${number}`}
            className="absolute bottom-0 right-0 top-0 z-40 flex w-[min(620px,92%)] flex-col border-l border-white/[0.08] bg-[#101010] shadow-pop"
            initial={{ x: 48, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 48, opacity: 0 }} transition={{ duration: 0.32, ease }}>
            <Body key={number} number={number} onClose={onClose} onChanged={onChanged} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Body({ number, onClose, onChanged }: { number: string; onClose: () => void; onChanged: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const toast = useToast();
  useKey("escape", () => onClose());

  const load = useCallback(async () => {
    const r = await bridge.api<Detail>("GET", `orders/${number}`);
    if (r.ok) setD(r.data); else setError(r.data.error || "Couldn’t load this order.");
  }, [number]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => bridge.onRefresh(load), [load]);

  /** Sends an action, shows the result, and refreshes this order and the list. */
  const act = async (route: string, body: object): Promise<Record<string, string> | undefined> => {
    const r = await bridge.api("POST", `orders/${number}/${route}`, body);
    if (!r.ok) { toast(r.data.error || "That didn’t work.", "error"); return r.data.fields ?? {}; }
    toast(r.data.ok || "Done.", r.data.ok?.includes("Heads up") ? "info" : "ok");
    await load(); onChanged();
    return undefined;
  };

  if (error) return <div className="p-8"><Header number={number} onClose={onClose} /><p className="mt-8 text-coral">{error}</p></div>;
  if (!d) return <div className="p-6"><Header number={number} onClose={onClose} /><div className="mt-10 grid place-items-center text-ink-muted"><Spinner className="h-6 w-6" /></div></div>;
  const o = d.order;

  return (
    <>
      <div className="shrink-0 border-b border-line px-6 pb-4 pt-5">
        <Header number={o.number} onClose={onClose} status={o.status} />
        <p className="mt-1 text-[12.5px] text-ink-muted">Placed {when(o.created_at)} · {pkr(total(o))} · {o.payment} · {d.previous ? `${d.previous} earlier order${d.previous > 1 ? "s" : ""}` : "First order"}</p>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <Section i={0}><NextStep o={o} mail={d.mail} act={act} /></Section>
        <Section i={1}><Customer o={o} act={act} /></Section>
        <Section i={2}><Items o={o} trackingPage={d.trackingPage} /></Section>
        <Section i={3}><Timeline events={d.events} mail={d.mail && !!o.email} act={act} /></Section>
        <Section i={4}><More o={o} mail={d.mail && !!o.email} act={act} /></Section>
      </div>
    </>
  );
}

function Header({ number, onClose, status }: { number: string; onClose: () => void; status?: Status }) {
  return (
    <div className="flex items-center gap-2.5">
      <h2 className="font-mono text-[22px] font-bold normal-case tracking-tight" style={{ fontFamily: "Cascadia Mono, Consolas, monospace" }} data-selectable>#{number}</h2>
      <CopyButton text={number} label="Copy order number" />
      {status && <Badge status={status} />}
      <button type="button" onClick={onClose} aria-label="Close (Esc)" title="Close (Esc)" className="ml-auto grid h-8 w-8 place-items-center rounded-md text-ink-muted transition hover:bg-white/[0.07] hover:text-ink active:scale-90"><Icon name="close" className="h-4 w-4" /></button>
    </div>
  );
}

function Section({ i, children }: { i: number; children: React.ReactNode }) {
  return <motion.section className="card p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 + i * 0.05, ease }}>{children}</motion.section>;
}

type Act = (route: string, body: object) => Promise<Record<string, string> | undefined>;

function NextStep({ o, mail, act }: { o: Order; mail: boolean; act: Act }) {
  const canEmail = mail && !!o.email;
  const [busy, setBusy] = useState<string | null>(null);
  const [notify, setNotify] = useState(true);
  const [ship, setShip] = useState({ courier: o.courier, tracking_number: o.tracking_number, tracking_url: o.tracking_url });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const go = async (key: string, status: Status, extra: object = {}) => {
    setBusy(key); setErrs({});
    const f = await act("status", { status, notify: canEmail && notify, ...extra });
    if (f) setErrs(f);
    setBusy(null);
  };
  const n = (label: string) => canEmail
    ? <Check checked={notify} onChange={setNotify} label={label} />
    : <p className="text-[12px] text-ink-muted">{mail ? "This customer gave a phone number, not an email, so they won’t be emailed." : "Emails are off."} They can still see the status on their tracking page.</p>;

  const title = ({ pending: "Verify the payment", processing: "Ship it", shipped: "Confirm delivery", delivered: "All done", cancelled: "Cancelled", returned: "Returned" } as const)[o.status];
  return (
    <div>
      <p className="label">Next step</p>
      <h3 className="mt-1.5 text-[21px]">{title}</h3>
      <AnimatePresence mode="wait">
        <motion.div key={o.status} className="mt-3 space-y-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
          {o.status === "pending" && (<>
            <p className="text-ink-body">The customer chose <strong className="text-ink">{o.payment}</strong>. Check your account for <strong className="text-ink">{pkr(total(o))}</strong> with order number <strong className="text-ink">#{o.number}</strong>. Confirming takes the items out of stock.</p>
            {n("Email the customer a payment confirmation")}
            <Button busy={busy === "paid"} onClick={() => go("paid", "processing")} className="btn-primary h-10">Confirm payment</Button>
          </>)}
          {o.status === "processing" && (<>
            <p className="text-ink-body">{isCod(o) ? <>Cash on Delivery: collect <strong className="text-ink">{pkr(total(o))}</strong> on delivery.</> : "Paid."} Pack the order, book the courier, then add the tracking details.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Courier" placeholder="TCS, Leopards, M&P…" value={ship.courier} onChange={(e) => setShip({ ...ship, courier: e.target.value })} list="couriers" />
              <Field label="Tracking number" placeholder="e.g. 7731 2290 11" value={ship.tracking_number} onChange={(e) => setShip({ ...ship, tracking_number: e.target.value })} />
              <Field className="col-span-2" label={<>Tracking link <span className="font-normal text-ink-muted">(optional)</span></>} placeholder="https://…" value={ship.tracking_url} error={errs.tracking_url} onChange={(e) => setShip({ ...ship, tracking_url: e.target.value })} />
              <datalist id="couriers">{["TCS", "Leopards", "M&P", "PostEx", "Trax", "Call Courier", "Pakistan Post", "BlueEX"].map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            {n("Email the customer their tracking details")}
            <Button busy={busy === "ship"} onClick={() => go("ship", "shipped", ship)} className="btn-primary h-10">Mark as shipped</Button>
          </>)}
          {o.status === "shipped" && (<>
            <p className="text-ink-body">On its way with {o.courier || "the courier"}{o.tracking_number ? ` (${o.tracking_number})` : ""}. Mark it delivered once it arrives{isCod(o) ? " and the cash is collected" : ""}.</p>
            {n("Email the customer a thank-you")}
            <Button busy={busy === "del"} onClick={() => go("del", "delivered")} className="btn-primary h-10">Mark as delivered</Button>
          </>)}
          {o.status === "delivered" && <p className="flex items-center gap-2 text-ink-body"><span className="grid h-6 w-6 place-items-center rounded-md bg-mint/15 text-mint"><Icon name="check" className="h-4 w-4" /></span>Delivered. Nothing left to do.</p>}
          {(o.status === "cancelled" || o.status === "returned") && (<>
            <p className="text-ink-body">This order is {o.status} and its items are back in stock. Reopen it to take them out of stock again.</p>
            <Button busy={busy === "reopen"} onClick={() => go("reopen", "processing", { message: "Order reopened.", notify: false })} className="btn-ghost h-10">Reopen order</Button>
          </>)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const detailsOf = (o: Order) => ({ first_name: o.first_name, last_name: o.last_name, phone: o.phone, address: o.address, apartment: o.apartment, city: o.city, postal_code: o.postal_code });

function Customer({ o, act }: { o: Order; act: Act }) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(detailsOf(o));
  const [busy, setBusy] = useState(false);
  useEffect(() => setV(detailsOf(o)), [o]);
  const phone = o.phone.replace(/[^\d+]/g, "");
  const wa = `https://wa.me/${phone.replace(/^\+/, "").replace(/^0/, "92")}?text=${encodeURIComponent(`Hi ${first(o.name)}, this is Vextio about your order #${o.number}.`)}`;
  const shipTo = [o.address + (o.apartment ? `, ${o.apartment}` : ""), o.city + (o.postal_code ? `, ${o.postal_code}` : ""), "Pakistan"].join("\n");
  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <p className="label">Customer</p>
          <p className="mt-1.5 text-[18px] font-bold">{o.name}</p>
          <p className="text-[12.5px] text-ink-muted">{o.email ? "Gave an email" : "Gave a phone number only"}</p>
        </div>
        <button type="button" onClick={() => setEdit((e) => !e)} className="btn btn-quiet h-8 px-2.5 text-[12px]"><Icon name="edit" className="h-3.5 w-3.5" />{edit ? "Cancel" : "Edit"}</button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button type="button" className="btn btn-ghost" disabled={!o.email} onClick={() => bridge.open(`mailto:${o.email}?subject=${encodeURIComponent(`Your Vextio order #${o.number}`)}`)}><Icon name="mail" className="h-4 w-4" />Email</button>
        <button type="button" className="btn btn-ghost" onClick={() => bridge.open(`tel:${phone}`)}><Icon name="phone" className="h-4 w-4" />Call</button>
        <button type="button" className="btn btn-ghost" onClick={() => bridge.open(wa)}><Icon name="chat" className="h-4 w-4" />WhatsApp</button>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {edit ? (
          <motion.form key="edit" className="mt-4 grid grid-cols-2 gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onSubmit={async (e) => { e.preventDefault(); setBusy(true); const f = await act("details", v); setBusy(false); if (!f) setEdit(false); }}>
            <Field label="First name" value={v.first_name} onChange={(e) => setV({ ...v, first_name: e.target.value })} />
            <Field label="Last name" value={v.last_name} onChange={(e) => setV({ ...v, last_name: e.target.value })} />
            <Field label="Phone" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} />
            <Field label="Apartment" value={v.apartment} onChange={(e) => setV({ ...v, apartment: e.target.value })} />
            <Area className="col-span-2" rows={2} label="Address" value={v.address} onChange={(e) => setV({ ...v, address: e.target.value })} />
            <Field label="City" value={v.city} onChange={(e) => setV({ ...v, city: e.target.value })} />
            <Field label="Postal code" value={v.postal_code} onChange={(e) => setV({ ...v, postal_code: e.target.value })} />
            <div className="col-span-2"><Button busy={busy} type="submit" className="btn-primary">Save details</Button></div>
          </motion.form>
        ) : (
          <motion.dl key="view" className="mt-4 divide-y divide-line text-[13px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Row k="Contact" v={o.contact} />
            <Row k="Phone" v={o.phone} />
            <Row k="Ship to" v={shipTo} copy={`${o.name}\n${shipTo}\n${o.phone}`} />
          </motion.dl>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ k, v, copy }: { k: string; v: string; copy?: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <dt className="w-16 shrink-0 pt-0.5 text-[12px] text-ink-muted">{k}</dt>
      <dd className="min-w-0 flex-1 whitespace-pre-line break-words" data-selectable>{v}</dd>
      <CopyButton text={copy ?? v} label={`Copy ${k.toLowerCase()}`} />
    </div>
  );
}

function Items({ o, trackingPage }: { o: Order; trackingPage: string }) {
  return (
    <div>
      <p className="label">Items</p>
      <ul className="mt-2 divide-y divide-line">
        {o.items.map((it, i) => (
          <li key={i} className="flex items-center gap-3 py-2.5">
            {it.imageUrl
              ? <img src={it.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover ring-1 ring-line" />
              : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-white/[0.04] text-ink-muted ring-1 ring-line"><Icon name="tag" className="h-5 w-5" /></span>}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{it.name}</p>
              <p className="text-[12.5px] text-ink-muted">{it.size ? `Size ${it.size} · ` : ""}Qty {it.qty}</p>
            </div>
            <p className="text-right font-semibold tabular-nums">{it.price}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-2 space-y-1 border-t border-line pt-3 text-[13px] tabular-nums">
        <div className="flex justify-between text-ink-muted"><dt>Subtotal</dt><dd>{pkr(o.subtotal)}</dd></div>
        <div className="flex justify-between text-ink-muted"><dt>Shipping</dt><dd>{pkr(o.shipping)}</dd></div>
        <div className="flex justify-between text-[15px] font-bold"><dt>Total</dt><dd>{pkr(total(o))}</dd></div>
      </dl>
      {(o.courier || o.tracking_number) && (
        <dl className="mt-3 divide-y divide-line border-t border-line text-[13px]">
          {o.courier && <Row k="Courier" v={o.courier} />}
          {o.tracking_number && <Row k="Tracking" v={o.tracking_number} />}
        </dl>
      )}
      <button type="button" onClick={() => bridge.open(trackingPage)} className="btn btn-ghost mt-3 w-full">See the customer’s tracking page<Icon name="external" className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function Timeline({ events, mail, act }: { events: OrderEvent[]; mail: boolean; act: Act }) {
  const [text, setText] = useState("");
  const [notify, setNotify] = useState(false);
  const [busy, setBusy] = useState(false);
  const add = async () => {
    if (text.trim().length < 2) return;
    setBusy(true);
    const f = await act("note", { message: text, notify: mail && notify });
    setBusy(false);
    if (!f) { setText(""); setNotify(false); }
  };
  return (
    <div>
      <p className="label">Timeline</p>
      <ol className="mt-3">
        <AnimatePresence initial={false}>
          {[...events].reverse().map((e, i, arr) => (
            <motion.li key={e.id} layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="relative flex gap-3 pb-4 last:pb-0">
              {i < arr.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-white/[0.07]" />}
              <span className={`relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ${e.status ? statusInfo[e.status].dot : e.kind === "email" ? "bg-white/25" : "bg-white/60"} ${i === 0 ? "ring-4 ring-white/[0.06]" : ""}`} />
              <div className="min-w-0">
                <p className="text-[13.5px]" data-selectable>{e.status && <span className="font-semibold">{statusInfo[e.status].label} · </span>}{e.message || (e.status ? "" : "—")}</p>
                <p className="mt-0.5 text-[11.5px] text-ink-muted">{when(e.created_at)} · {e.actor}</p>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
      <div className="mt-4 border-t border-line pt-4">
        <Area label="Add a note" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={notify ? "This will be emailed to the customer…" : "Only the team can see this…"}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) add(); }} />
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          {mail && <Check checked={notify} onChange={setNotify} label="Also email it to the customer" />}
          <Button busy={busy} onClick={add} disabled={text.trim().length < 2} className="btn-ghost ml-auto">Add note <span className="kbd">Ctrl ↵</span></Button>
        </div>
      </div>
    </div>
  );
}

function More({ o, mail, act }: { o: Order; mail: boolean; act: Act }) {
  const [open, setOpen] = useState<"cancel" | "status" | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>(o.status);
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const run = async (s: Status) => {
    setBusy(true);
    const f = await act("status", { status: s, message, notify: mail && notify });
    setBusy(false);
    if (!f) { setOpen(null); setMessage(""); }
  };
  const closed = o.status === "cancelled" || o.status === "returned";
  return (
    <div>
      <p className="label">More</p>
      <div className="mt-3 flex gap-2">
        {!closed && <button type="button" className={`btn ${open === "cancel" ? "btn-danger" : "btn-ghost"}`} onClick={() => setOpen(open === "cancel" ? null : "cancel")}>Cancel order</button>}
        <button type="button" className="btn btn-ghost" onClick={() => { setStatus(o.status); setOpen(open === "status" ? null : "status"); }}>Change status</button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key={open} className="overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="mt-4 space-y-3 border-t border-line pt-4">
              {open === "status" && (
                <div className="grid grid-cols-3 gap-1.5">
                  {STATUSES.map((s) => (
                    <button key={s} type="button" onClick={() => setStatus(s)}
                      className={`flex h-9 items-center gap-2 rounded-lg px-3 text-[12.5px] font-semibold ring-1 transition active:scale-95 ${status === s ? "bg-white/[0.08] ring-pink" : "ring-line hover:bg-white/[0.04]"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusInfo[s].dot}`} />{statusInfo[s].label}
                    </button>
                  ))}
                </div>
              )}
              <Area label={open === "cancel" ? "Reason (included in the email)" : <>Message <span className="font-normal text-ink-muted">(optional, included in the email)</span></>} rows={2} value={message}
                onChange={(e) => setMessage(e.target.value)} placeholder={open === "cancel" ? "e.g. You asked us to cancel. Your items are back on sale." : ""} />
              {mail && <Check checked={notify} onChange={setNotify} label="Email the customer" />}
              <p className="text-[12px] text-ink-muted">Cancelled and returned orders put their items back in stock. Moving an order to To ship, Shipped or Delivered takes them out.</p>
              {open === "cancel"
                ? <Button busy={busy} onClick={() => run("cancelled")} className="btn-danger h-10">Cancel this order</Button>
                : <Button busy={busy} disabled={status === o.status} onClick={() => run(status)} className="btn-primary h-10">Update status</Button>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
