import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { bridge } from "../bridge";
import { statusInfo, type Status } from "../status";
import markUrl from "../assets/mark.png";

export const ease = [0.22, 1, 0.36, 1] as const;

// ---------- Icons ----------
const paths = {
  orders: <><rect x="4" y="3" width="16" height="18" rx="2.5" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  customers: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 20a6.5 6.5 0 0 0-2.5-5.1" /></>,
  settings: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" /></>,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  refresh: <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></>,
  out: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
  chat: <path d="M4 20l1.5-4.5A8 8 0 1 1 9 19.2L4 20Z" />,
  external: <><path d="M14 4h6v6M20 4 10 14" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  box: <><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5Z" /><path d="m3 7.5 9 4.5 9-4.5M12 12v9" /></>,
  bell: <><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4Z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  wifiOff: <><path d="M3 3l18 18" /><path d="M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M12 20h.01" /></>,
  more: <><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16Z" /><path d="m13.5 6.5 4 4" /></>,
  tag: <><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9Z" /><circle cx="8" cy="8" r="1.5" /></>,
  inbox: <><path d="M3 13h5l1.5 3h5L16 13h5" /><path d="M5 5h14l2 8v6H3v-6Z" /></>,
  minus: <path d="M5 12h14" />,
  up: <path d="m6 15 6-6 6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  left: <path d="m15 6-6 6 6 6" />,
  right: <path d="m9 6 6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  reply: <><path d="M9 7 4 12l5 5" /><path d="M4 12h11a5 5 0 0 1 5 5v2" /></>,
  store: <><path d="M3 9l1.5-5h15L21 9" /><path d="M4 9v11h16V9" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /></>,
};
export type IconName = keyof typeof paths;
export function Icon({ name, className = "h-[18px] w-[18px]" }: { name: IconName; className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths[name]}</svg>;
}

export function Mark({ className = "h-7 w-auto" }: { className?: string }) {
  return <img src={markUrl} alt="" draggable={false} className={className} />;
}

// ---------- Pieces ----------
export function Badge({ status, className = "" }: { status: Status; className?: string }) {
  const s = statusInfo[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-[3px] text-[12px] font-semibold ring-1 ${s.tone} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{s.label}
    </span>
  );
}

export function Fade({ i = 0, className, children, ...rest }: { i?: number } & HTMLMotionProps<"div">) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: Math.min(i, 12) * 0.035, ease }} {...rest}>
      {children}
    </motion.div>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-current/30 border-t-current ${className}`} aria-hidden />;
}

export function Button({ busy, children, className = "btn-primary", ...rest }: { busy?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} disabled={busy || rest.disabled} className={`btn ${className}`}>
      {busy && <Spinner className="h-3.5 w-3.5" />}{children}
    </button>
  );
}

export function Field({ label, error, hint, className, ...rest }: { label: ReactNode; error?: string; hint?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="text-[12.5px] font-semibold text-ink-body">{label}</label>
      <input id={id} className="input" aria-invalid={error ? true : undefined} {...rest} />
      <Err msg={error} hint={hint} />
    </div>
  );
}
export function Area({ label, error, hint, className, ...rest }: { label: ReactNode; error?: string; hint?: ReactNode } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="text-[12.5px] font-semibold text-ink-body">{label}</label>
      <textarea id={id} className="input resize-none" aria-invalid={error ? true : undefined} {...rest} />
      <Err msg={error} hint={hint} />
    </div>
  );
}
function Err({ msg, hint }: { msg?: string; hint?: ReactNode }) {
  return (
    <AnimatePresence initial={false} mode="wait">
      {msg ? (
        <motion.p key="e" role="alert" className="mt-1.5 text-[12.5px] text-coral" initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{msg}</motion.p>
      ) : hint ? (
        <motion.p key="h" className="mt-1.5 text-[12px] text-ink-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{hint}</motion.p>
      ) : null}
    </AnimatePresence>
  );
}

export function Check({ label, checked, onChange, description }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; description?: ReactNode }) {
  return (
    <label className="flex cursor-default items-start gap-3">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-md transition-colors ${checked ? "bg-pink" : "bg-white/[0.12]"}`}>
        <motion.span className="absolute top-0.5 h-4 w-4 rounded bg-paper shadow" animate={{ left: checked ? 18 : 2 }} transition={{ type: "spring", stiffness: 600, damping: 34 }} />
      </button>
      <span className="text-[13px]">
        <span className="block font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-[12px] text-ink-muted">{description}</span>}
      </span>
    </label>
  );
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" title={label} aria-label={label}
      onClick={() => bridge.copy(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1300); })}
      className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-ink-muted transition hover:bg-white/[0.07] hover:text-ink active:scale-90">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={String(done)} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.14 }}>
          <Icon name={done ? "check" : "copy"} className={`h-[15px] w-[15px] ${done ? "text-mint" : ""}`} />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export function Empty({ title, text, icon = "box" }: { title: string; text: string; icon?: IconName }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center px-6 py-16 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/[0.04] text-ink-muted ring-1 ring-line"><Icon name={icon} className="h-6 w-6" /></span>
      <p className="mt-4 font-display text-[17px] font-bold">{title}</p>
      <p className="mt-1 max-w-xs text-[13px] text-ink-muted">{text}</p>
    </motion.div>
  );
}

// ---------- Toasts ----------
type Toast = { id: number; text: string; tone: "ok" | "error" | "info"; action?: { label: string; run: () => void } };
const ToastCtx = createContext<(text: string, tone?: Toast["tone"], action?: Toast["action"]) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function Toasts({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const n = useRef(0);
  const push = useCallback((text: string, tone: Toast["tone"] = "ok", action?: Toast["action"]) => {
    const id = ++n.current;
    setList((l) => [...l.slice(-3), { id, text, tone, action }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), tone === "error" ? 6000 : 3800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[80] flex w-[340px] flex-col gap-2" aria-live="polite">
        <AnimatePresence initial={false}>
          {list.map((t) => (
            <motion.div key={t.id} layout className="pointer-events-auto flex items-center gap-3 rounded-xl bg-raised px-4 py-3 shadow-pop ring-1 ring-white/[0.08]"
              initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }} transition={{ type: "spring", stiffness: 420, damping: 32 }}>
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${t.tone === "error" ? "bg-coral/15 text-coral" : t.tone === "info" ? "bg-blue/15 text-blue" : "bg-mint/15 text-mint"}`}>
                <Icon name={t.tone === "error" ? "close" : t.tone === "info" ? "bell" : "check"} className="h-3.5 w-3.5" />
              </span>
              <p className="flex-1 text-[13px]">{t.text}</p>
              {t.action && <button className="btn btn-ghost h-7 px-2.5 text-[12px]" onClick={() => { t.action!.run(); setList((l) => l.filter((x) => x.id !== t.id)); }}>{t.action.label}</button>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

// ---------- Hooks ----------
export function useKey(combo: string, fn: (e: KeyboardEvent) => void, deps: unknown[] = []) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const parts = combo.toLowerCase().split("+");
      const key = parts.pop();
      const mod = parts.includes("mod"), shift = parts.includes("shift");
      if (mod !== (e.ctrlKey || e.metaKey) || shift !== e.shiftKey) return;
      if (e.key.toLowerCase() !== key) return;
      fn(e);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Calls the website and turns failures into a friendly message. */
export async function call<T = any>(method: "GET" | "POST", route: string, body?: unknown) {
  const r = await bridge.api<T>(method, route, body);
  return r;
}
