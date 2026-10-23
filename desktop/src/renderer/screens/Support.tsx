import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { bridge } from "../bridge";
import { ago, when } from "../format";
import { Area, Button, CopyButton, Empty, Fade, Icon, useToast } from "../ui/kit";

type Message = { id: number; from_name: string | null; from_email: string; subject: string | null; body_text: string | null; status: "open" | "replied" | "closed"; created_at: string; replied_at: string | null };
type Filter = "open" | "replied" | "closed" | "all";
const TONE: Record<Message["status"], string> = { open: "bg-pink/10 text-pink ring-pink/25", replied: "bg-sky/10 text-sky ring-sky/25", closed: "bg-white/[0.05] text-ink-muted ring-line" };
const LABEL: Record<Message["status"], string> = { open: "Open", replied: "Replied", closed: "Closed" };

export default function Support({ version, onChanged }: { version: number; onChanged: () => void }) {
  const [data, setData] = useState<{ messages: Message[]; available: boolean } | null>(null);
  const [filter, setFilter] = useState<Filter>("open");
  const [selected, setSelected] = useState<number | null>(null);
  const toast = useToast();

  const load = () => bridge.api<{ messages: Message[]; available: boolean }>("GET", "support").then((r) => {
    if (r.ok) setData(r.data); else toast(r.data.error || "Couldn’t load messages.", "error");
  });
  useEffect(() => { load(); }, [version]); // eslint-disable-line react-hooks/exhaustive-deps

  const messages = data?.messages ?? [];
  const counts = useMemo(() => ({
    open: messages.filter((m) => m.status === "open").length,
    replied: messages.filter((m) => m.status === "replied").length,
    closed: messages.filter((m) => m.status === "closed").length,
    all: messages.length,
  }), [messages]);
  const list = messages.filter((m) => filter === "all" || m.status === filter);
  const current = messages.find((m) => m.id === selected) ?? null;
  useEffect(() => { if (!current && list[0]) setSelected(list[0].id); }, [list, current]);

  const changed = async () => { await load(); onChanged(); };

  return (
    <div className="flex h-full flex-col px-8 pb-6 pt-7">
      <Fade>
        <h1 className="text-[30px] leading-tight">Support</h1>
        <p className="mt-0.5 text-[13px] text-ink-muted">{data ? (data.available ? `${counts.open} open · ${counts.replied} replied · ${counts.closed} closed` : "Support messages aren’t set up on this shop yet.") : "Loading…"}</p>
      </Fade>

      <Fade i={1} className="mt-5 flex gap-0.5 self-start rounded-xl bg-white/[0.03] p-1 ring-1 ring-line" role="tablist">
        {(["open", "replied", "closed", "all"] as const).map((k) => (
          <button key={k} role="tab" type="button" aria-selected={filter === k} onClick={() => { setFilter(k); setSelected(null); }}
            className={`relative flex h-8 items-center gap-2 rounded-lg px-3 text-[12.5px] font-semibold transition-colors active:scale-95 ${filter === k ? "text-night" : "text-ink-muted hover:text-ink"}`}>
            {filter === k && <motion.span layoutId="support-filter" className="absolute inset-0 rounded-lg bg-paper" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            <span className="relative">{k === "all" ? "All" : LABEL[k]}</span>
            <span className={`relative rounded px-1.5 text-[11px] tabular-nums ${filter === k ? "bg-night/10" : "bg-white/[0.06]"}`}>{counts[k]}</span>
          </button>
        ))}
      </Fade>

      <Fade i={2} className="mt-4 flex min-h-0 flex-1 gap-4">
        <div className="card flex w-[360px] shrink-0 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {data && list.length === 0 && <Empty icon="inbox" title={filter === "open" ? "Inbox zero" : "Nothing here"} text={filter === "open" ? "No open messages. Nice work." : "No messages in this list."} />}
            {list.map((m, i) => (
              <motion.button key={m.id} type="button" onClick={() => setSelected(m.id)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 14) * 0.02 } }}
                className={`relative block w-full border-b border-white/[0.035] px-4 py-3 text-left transition-colors ${selected === m.id ? "bg-pink/[0.07]" : "hover:bg-white/[0.025]"}`}>
                {selected === m.id && <motion.span layoutId="support-mark" className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r bg-pink" />}
                <span className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate font-semibold">{m.from_name || m.from_email}</span>
                  <span className="shrink-0 text-[11.5px] text-ink-muted">{ago(m.created_at)}</span>
                </span>
                <span className="mt-0.5 block truncate text-[13px] text-ink-body">{m.subject || "(no subject)"}</span>
                <span className="mt-0.5 block truncate text-[12px] text-ink-muted">{(m.body_text || "").replace(/\s+/g, " ").slice(0, 120)}</span>
              </motion.button>
            ))}
          </div>
        </div>
        <div className="card min-w-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {current ? <Thread key={current.id} m={current} onChanged={changed} /> : (
              <motion.div key="none" className="grid h-full place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Empty icon="inbox" title="Pick a message" text="Choose a message on the left to read and reply." />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Fade>
    </div>
  );
}

function Thread({ m, onChanged }: { m: Message; onChanged: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();
  const name = (m.from_name || "").trim().split(/\s+/)[0];

  const send = async () => {
    if (text.trim().length < 2) return;
    setBusy("reply");
    const r = await bridge.api("POST", `support/${m.id}/reply`, { text });
    setBusy(null);
    if (r.ok) { toast(r.data.ok || "Sent."); setText(""); onChanged(); } else toast(r.data.error || "Couldn’t send.", "error");
  };
  const setStatus = async (status: Message["status"]) => {
    setBusy(status);
    const r = await bridge.api("POST", `support/${m.id}/status`, { status });
    setBusy(null);
    if (r.ok) { toast(r.data.ok || "Updated."); onChanged(); } else toast(r.data.error || "Couldn’t update.", "error");
  };

  return (
    <motion.div className="flex h-full flex-col" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <div className="shrink-0 border-b border-line px-6 py-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-bold" data-selectable>{m.subject || "(no subject)"}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-ink-muted">
              <span data-selectable>{m.from_name ? `${m.from_name} · ` : ""}{m.from_email}</span>
              <CopyButton text={m.from_email} label="Copy email" />
              <span>· {when(m.created_at)}</span>
            </p>
          </div>
          <span className={`inline-flex items-center rounded-md px-2 py-[3px] text-[12px] font-semibold ring-1 ${TONE[m.status]}`}>{LABEL[m.status]}</span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <p className="whitespace-pre-line text-[14px] leading-relaxed text-ink-body" data-selectable>{m.body_text || "(empty message)"}</p>
        {m.replied_at && <p className="mt-6 text-[12px] text-ink-muted">You replied {when(m.replied_at)}.</p>}
      </div>
      <div className="shrink-0 border-t border-line px-6 py-4">
        <Area label={`Reply to ${name || m.from_email}`} rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your reply. It’s sent from help@ by email."
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(); }} />
        <div className="mt-3 flex items-center gap-2">
          {m.status !== "closed"
            ? <Button busy={busy === "closed"} onClick={() => setStatus("closed")} className="btn-ghost"><Icon name="check" className="h-4 w-4" />Close</Button>
            : <Button busy={busy === "open"} onClick={() => setStatus("open")} className="btn-ghost">Reopen</Button>}
          <Button busy={busy === "reply"} disabled={text.trim().length < 2} onClick={send} className="btn-primary ml-auto"><Icon name="reply" className="h-4 w-4" />Send reply <span className="kbd">Ctrl ↵</span></Button>
        </div>
      </div>
    </motion.div>
  );
}
