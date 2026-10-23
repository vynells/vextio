import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { bridge, isDesktop, type Config, type Me, type Update } from "../bridge";
import { when } from "../format";
import { Area, Button, Check, Fade, Field, Icon, useToast } from "../ui/kit";

type Settings = { shipping_fee: string; notify_emails: string };
type Team = { id: number; login: string; name: string; role: string; last_login_at: string | null };
type Data = { settings: Settings; team: Team[]; me: Me; mail: { on: boolean; provider: string }; site: string };

const TABS = [["shop", "Shop"], ["automation", "Automation"], ["team", "Team"], ["app", "This app"], ["account", "Account"]] as const;
type Tab = (typeof TABS)[number][0];

export default function SettingsScreen({ config, setConfig, onSignOut }: { config: Config | null; setConfig: (c: Config) => void; onSignOut: () => void }) {
  const [d, setD] = useState<Data | null>(null);
  const [tab, setTab] = useState<Tab>("shop");
  const load = () => bridge.api<Data>("GET", "settings").then((r) => r.ok && setD(r.data));
  useEffect(() => { load(); }, []);

  return (
    <div className="flex h-full flex-col px-8 pb-6 pt-7">
      <Fade>
        <h1 className="text-[30px] font-bold leading-tight tracking-tight">Settings</h1>
        <p className="mt-0.5 text-[13px] text-ink-muted">How orders work on your shop, your team, and this app.</p>
      </Fade>
      <div className="mt-5 flex min-h-0 flex-1 gap-6">
        <Fade i={1} className="w-48 shrink-0 space-y-0.5">
          {TABS.map(([k, l]) => (
            <button key={k} type="button" onClick={() => setTab(k)} className={`relative flex h-9 w-full items-center rounded-lg px-3 text-[13px] font-medium transition-colors active:scale-[0.98] ${tab === k ? "text-ink" : "text-ink-muted hover:text-ink"}`}>
              {tab === k && <motion.span layoutId="settings-tab" className="absolute inset-0 rounded-lg bg-white/[0.07]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <span className="relative">{l}</span>
            </button>
          ))}
        </Fade>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="max-w-[720px] space-y-4 pb-4">
              {!d && tab !== "app" ? <div className="card h-40 animate-pulse" /> : null}
              {d && tab === "shop" && <Shop s={d.settings} onSaved={load} />}
              {d && tab === "automation" && <Automation d={d} />}
              {d && tab === "team" && <TeamPanel d={d} reload={load} />}
              {tab === "app" && <><Updates version={config?.version ?? ""} /><AppPrefs config={config} setConfig={setConfig} /></>}
              {d && tab === "account" && <Account d={d} config={config} onSignOut={onSignOut} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Card({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="text-[16px] font-bold">{title}</h2>
      {text && <p className="mt-1 text-[13px] text-ink-muted">{text}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Shop({ s, onSaved }: { s: Settings; onSaved: () => void }) {
  const [v, setV] = useState(s);
  const [busy, setBusy] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const toast = useToast();
  const dirty = JSON.stringify(v) !== JSON.stringify(s);
  const save = async () => {
    setBusy(true);
    const r = await bridge.api("POST", "settings", v);
    setBusy(false);
    if (r.ok) { setErrs({}); toast(r.data.ok || "Saved."); onSaved(); } else { setErrs(r.data.fields ?? {}); toast(r.data.error || "Couldn’t save.", "error"); }
  };
  return (
    <>
      <Card title="Orders" text="Used by the website’s checkout straight away.">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Shipping fee (PKR)" type="number" min={0} value={v.shipping_fee} onChange={(e) => setV({ ...v, shipping_fee: e.target.value })} hint="Added to every order. 0 means free shipping." />
          <Field className="col-span-2" label="New-order emails go to" value={v.notify_emails} error={errs.notify_emails} onChange={(e) => setV({ ...v, notify_emails: e.target.value })} hint="Separate several emails with commas." />
        </div>
      </Card>
      <AnimatePresence>
        {dirty && (
          <motion.div className="sticky bottom-0 flex items-center gap-3 rounded-xl bg-raised p-3 pl-4 shadow-pop ring-1 ring-white/[0.08]" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}>
            <span className="text-[13px] text-ink-body">You have unsaved changes.</span>
            <button type="button" className="btn btn-quiet ml-auto" onClick={() => setV(s)}>Discard</button>
            <Button busy={busy} onClick={save} className="btn-primary">Save changes</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Automation({ d }: { d: Data }) {
  const rows = [
    { on: true, t: "Order numbers", x: "Every order gets a unique number like 261023482917, saved with all its details." },
    { on: true, t: "No overselling", x: "Checkout checks stock with the real prices, and two people can’t buy the last one at the same time." },
    { on: true, t: "Stock follows the order", x: "COD orders take stock straight away, paid orders when you confirm payment. Cancelled and returned orders put it back." },
    { on: true, t: "Live tracking", x: "Customers see the status, courier and tracking number on their tracking page." },
    { on: true, t: "Desktop notifications", x: "This app tells you about new orders and support messages, even from the tray." },
    { on: d.mail.on, t: "Automatic emails", x: d.mail.on ? `On, via ${d.mail.provider}. You choose at each step whether the customer is emailed.` : "Off. In Vercel, add RESEND_API_KEY, then redeploy." },
  ];
  return (
    <Card title="What happens automatically">
      <ul className="grid grid-cols-2 gap-3">
        {rows.map((r, i) => (
          <motion.li key={r.t} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }} className="flex gap-3 rounded-lg bg-white/[0.02] p-3.5 ring-1 ring-line">
            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md ${r.on ? "bg-mint/20 text-mint" : "bg-white/[0.06] text-ink-muted"}`}>{r.on ? <Icon name="check" className="h-3.5 w-3.5" /> : "–"}</span>
            <div><p className="text-[13px] font-semibold">{r.t}</p><p className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">{r.x}</p></div>
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}

function TeamPanel({ d, reload }: { d: Data; reload: () => void }) {
  const [v, setV] = useState({ name: "", login: "", password: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const owner = d.me.role === "owner";
  const add = async () => {
    setBusy(true);
    const r = await bridge.api("POST", "team", v);
    setBusy(false);
    if (r.ok) { toast(r.data.ok); setV({ name: "", login: "", password: "" }); setErrs({}); reload(); } else { setErrs(r.data.fields ?? {}); toast(r.data.error || "Couldn’t add them.", "error"); }
  };
  const remove = async (id: number, name: string) => {
    if (!confirm(`Remove ${name}? They won’t be able to sign in any more.`)) return;
    const r = await bridge.api("POST", "team/remove", { id });
    if (r.ok) { toast(`${name} removed.`); reload(); } else toast(r.data.error || "Couldn’t remove.", "error");
  };
  return (
    <>
      <Card title="Who has access">
        <ul className="divide-y divide-line">
          {d.team.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue/20 font-bold text-blue">{(t.name || t.login).slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{t.name || t.login} <span className="ml-1 text-[12px] font-normal text-ink-muted">{t.role === "owner" ? "Owner" : "Team"}{t.id === d.me.id ? " · you" : ""}</span></p>
                <p className="truncate text-[12px] text-ink-muted">{t.login} · {t.last_login_at ? `last signed in ${when(t.last_login_at)}` : "hasn’t signed in yet"}</p>
              </div>
              {owner && t.role !== "owner" && <button type="button" className="btn btn-ghost h-8 text-[12px]" onClick={() => remove(t.id, t.name || t.login)}>Remove</button>}
            </li>
          ))}
        </ul>
      </Card>
      {owner && (
        <Card title="Add a team member" text="They can sign in to this app with these details. Share the password privately; they can change it under Account.">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="Their name" />
            <Field label="Username" value={v.login} error={errs.login} onChange={(e) => setV({ ...v, login: e.target.value })} placeholder="e.g. ali" spellCheck={false} />
            <Field label="Temporary password" value={v.password} error={errs.password} onChange={(e) => setV({ ...v, password: e.target.value })} hint="8+ characters" />
          </div>
          <Button busy={busy} onClick={add} className="btn-primary mt-4">Give access</Button>
        </Card>
      )}
    </>
  );
}

function Updates({ version }: { version: string }) {
  const [u, setU] = useState<Update>({ state: "idle" });
  useEffect(() => { bridge.getUpdate().then(setU); return bridge.onUpdate(setU); }, []);
  const text = {
    idle: "Checks for updates automatically.",
    dev: "Updates are only available in the installed app.",
    checking: "Checking for updates…",
    current: "You’re on the latest version.",
    downloading: `Downloading ${u.version ?? "the update"}… ${u.percent ?? 0}%`,
    ready: `Version ${u.version} is downloaded. Restart to finish updating (or it installs next time you quit).`,
    error: `Couldn’t check for updates${u.message ? `: ${u.message}` : "."} It will try again later.`,
  }[u.state];
  return (
    <Card title="Updates" text={`Vextio Orders ${version}. New versions download by themselves, so you never need the installer again.`}>
      <div className="flex items-center gap-3">
        <p className="flex-1 text-[13px] text-ink-body">{text}</p>
        {u.state === "ready"
          ? <Button onClick={() => bridge.installUpdate()} className="btn-accent">Restart and update</Button>
          : <Button busy={u.state === "checking"} disabled={u.state === "dev" || u.state === "downloading"} onClick={() => bridge.checkUpdate().then(setU)} className="btn-ghost">Check for updates</Button>}
      </div>
    </Card>
  );
}

function AppPrefs({ config, setConfig }: { config: Config | null; setConfig: (c: Config) => void }) {
  if (!config) return null;
  const set = async (p: Partial<Config>) => setConfig(await bridge.setConfig(p));
  return (
    <Card title="This app" text={isDesktop ? "These settings only affect this computer." : "Desktop settings are available in the installed app."}>
      <div className="space-y-5">
        <Check checked={config.notify} onChange={(v) => set({ notify: v })} label="Notifications" description="Pop up a Windows notification for new orders and support messages." />
        <Check checked={config.sound} onChange={(v) => set({ sound: v })} label="Notification sound" description="Play the Windows notification sound." />
        <Check checked={config.closeToTray} onChange={(v) => set({ closeToTray: v })} label="Keep running in the tray when closed" description="Closing the window keeps Vextio Orders watching for new orders. Quit from the tray icon." />
        <Check checked={config.openAtLogin} onChange={(v) => set({ openAtLogin: v })} label="Start with Windows" description="Open quietly in the tray when you turn on your computer." />
      </div>
      <div className="mt-6 border-t border-line pt-4">
        <p className="label">Keyboard shortcuts</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-[13px]">
          {[["Ctrl K", "Search everything"], ["Ctrl F", "Search orders"], ["Ctrl 1 – 6", "Switch screens"], ["Ctrl S", "Save a product"], ["F5", "Refresh"], ["↑ ↓  Enter", "Move and open orders"], ["Esc", "Close an order"]].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between"><dt className="text-ink-muted">{v}</dt><dd><span className="kbd">{k}</span></dd></div>
          ))}
        </dl>
      </div>
    </Card>
  );
}

function Account({ d, config, onSignOut }: { d: Data; config: Config | null; onSignOut: () => void }) {
  const [v, setV] = useState({ current: "", password: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const change = async () => {
    setBusy(true);
    const r = await bridge.api("POST", "password", v);
    setBusy(false);
    if (r.ok) { toast(r.data.ok); setV({ current: "", password: "" }); setErrs({}); } else { setErrs(r.data.fields ?? {}); toast(r.data.error || "Couldn’t change it.", "error"); }
  };
  return (
    <>
      <Card title="Signed in">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-blue/20 text-[17px] font-bold text-blue">{(d.me.name || d.me.login).slice(0, 1).toUpperCase()}</span>
          <div className="flex-1"><p className="font-semibold">{d.me.name || d.me.login}</p><p className="text-[12.5px] text-ink-muted">{d.me.login} · connected to {d.site.replace(/^https?:\/\//, "")}</p></div>
          <button type="button" className="btn btn-ghost" onClick={onSignOut}><Icon name="out" className="h-4 w-4" />Sign out</button>
        </div>
      </Card>
      <Card title="Change your password" text="Changing it signs you out on every other device.">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Current password" type="password" value={v.current} error={errs.current} onChange={(e) => setV({ ...v, current: e.target.value })} />
          <Field label="New password" type="password" value={v.password} error={errs.password} onChange={(e) => setV({ ...v, password: e.target.value })} hint="8+ characters" />
        </div>
        <Button busy={busy} onClick={change} disabled={!v.current || !v.password} className="btn-primary mt-4">Change password</Button>
      </Card>
      <p className="px-1 text-[12px] text-ink-muted">Vextio Orders {config?.version} · Vextio</p>
    </>
  );
}
