import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { bridge, isDesktop, type Config, type Me } from "../bridge";
import { Button, ease, Field, Mark } from "../ui/kit";

export default function Login({ config, notice, onDone }: { config: Config | null; notice?: string; onDone: (me: Me) => void }) {
  const [login, setLogin] = useState(config?.me?.login ?? "");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState(config?.server ?? "");
  const [advanced, setAdvanced] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(notice ?? "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login || !password) { setError("Enter your username and password."); return; }
    setBusy(true); setError("");
    const r = await bridge.login(advanced ? server : "", login.trim(), password);
    setBusy(false);
    if (r.ok) onDone(r.data.me);
    else { setError(r.data?.error || "Couldn’t sign in."); setPassword(""); }
  };

  return (
    <div className="relative grid flex-1 place-items-center overflow-hidden">
      {/* soft brand glow */}
      <motion.div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-blue/[0.10] blur-3xl" animate={{ x: [0, 40, 0], y: [0, 30, 0] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden className="pointer-events-none absolute -bottom-48 -right-40 h-[560px] w-[560px] rounded-full bg-blue/[0.07] blur-3xl" animate={{ x: [0, -30, 0], y: [0, -40, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />

      <motion.div className="relative w-[380px]" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease }}>
        <div className="flex flex-col items-center text-center">
          <motion.div initial={{ scale: 0.8, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
            className="grid h-16 w-16 place-items-center rounded-2xl bg-surface ring-1 ring-line shadow-pop">
            <Mark className="h-7 w-auto" />
          </motion.div>
          <h1 className="mt-5 font-display text-[26px] font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-[13px] text-ink-muted">Sign in to manage Vextio orders.</p>
        </div>

        <form onSubmit={submit} className="card mt-7 space-y-4 p-6 shadow-pop" noValidate>
          <Field label="Username" autoComplete="username" autoFocus value={login} onChange={(e) => setLogin(e.target.value)} placeholder="The Vextio admin username" spellCheck={false} />
          <Field label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <AnimatePresence initial={false}>
            {advanced && (
              <motion.div className="overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <Field label="Website address" value={server} onChange={(e) => setServer(e.target.value)} spellCheck={false} hint="Only change this if your shop moves to a new domain." />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {error && (
              <motion.p role="alert" className="rounded-lg bg-coral/10 px-3 py-2.5 text-[13px] text-coral ring-1 ring-coral/30" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0, x: [0, -6, 6, -3, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <Button busy={busy} type="submit" className="btn-primary h-11 w-full text-[14px]">{busy ? "Signing in…" : "Sign in"}</Button>
        </form>
        <div className="mt-4 flex items-center justify-between px-1 text-[12px] text-ink-muted">
          {isDesktop ? (
            <button type="button" className="transition hover:text-ink" onClick={() => setAdvanced((a) => !a)}>{advanced ? "Hide" : "Connection settings"}</button>
          ) : <span />}
          <span>Team members only</span>
        </div>
      </motion.div>
    </div>
  );
}
