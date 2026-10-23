import { motion } from "motion/react";
import type { Me } from "../bridge";
import { Icon, type IconName } from "./kit";

export type Screen = "orders" | "customers" | "products" | "stock" | "support" | "settings";
const items: { k: Screen; label: string; icon: IconName; key: string }[] = [
  { k: "orders", label: "Orders", icon: "orders", key: "1" },
  { k: "customers", label: "Customers", icon: "customers", key: "2" },
  { k: "products", label: "Products", icon: "store", key: "3" },
  { k: "stock", label: "Stock", icon: "tag", key: "4" },
  { k: "support", label: "Support", icon: "inbox", key: "5" },
  { k: "settings", label: "Settings", icon: "settings", key: "6" },
];

export default function Sidebar({ screen, go, action, support, me, onSignOut, onOpenShop }: { screen: Screen; go: (s: Screen) => void; action: number; support: number; me: Me | null; onSignOut: () => void; onOpenShop: () => void }) {
  const name = me?.name || me?.login || "";
  return (
    <aside className="flex w-[232px] shrink-0 flex-col border-r border-line bg-side px-3 pb-3 pt-4">
      <p className="label px-3">Workspace</p>
      <nav className="mt-2 space-y-0.5" aria-label="Main">
        {items.map((it) => {
          const on = screen === it.k;
          return (
            <button key={it.k} type="button" onClick={() => go(it.k)} aria-current={on ? "page" : undefined} title={`${it.label} (Ctrl+${it.key})`}
              className={`relative flex h-9 w-full items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium transition-colors active:scale-[0.98] ${on ? "text-ink" : "text-ink-muted hover:bg-white/[0.03] hover:text-ink"}`}>
              {on && <motion.span layoutId="nav" className="absolute inset-0 rounded-lg bg-white/[0.07]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              {on && <motion.span layoutId="nav-bar" className="absolute -left-3 top-2 h-5 w-[3px] rounded-r bg-pink" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <span className="relative"><Icon name={it.icon} /></span>
              <span className="relative">{it.label}</span>
              {(it.k === "orders" ? action : it.k === "support" ? support : 0) > 0 && (
                <motion.span key={`${it.k}${it.k === "orders" ? action : support}`} initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="relative ml-auto grid h-5 min-w-5 place-items-center rounded-md bg-pink px-1.5 text-[11px] font-bold text-night">{it.k === "orders" ? action : support}</motion.span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1">
        <button type="button" onClick={onOpenShop} className="flex h-9 w-full items-center gap-3 rounded-lg px-3 text-[13px] text-ink-muted transition hover:bg-white/[0.03] hover:text-ink active:scale-[0.98]">
          <Icon name="store" className="h-4 w-4" />Open the shop<Icon name="external" className="ml-auto h-3.5 w-3.5 opacity-60" />
        </button>
        <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] p-2.5 ring-1 ring-line">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue/20 text-[13px] font-bold text-blue">{name.slice(0, 1).toUpperCase()}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold">{name}</span>
            <span className="block truncate text-[11.5px] text-ink-muted">{me?.role === "owner" ? "Owner" : "Team"}</span>
          </span>
          <button type="button" onClick={onSignOut} title="Sign out" aria-label="Sign out" className="grid h-7 w-7 place-items-center rounded-md text-ink-muted transition hover:bg-white/[0.07] hover:text-ink active:scale-90"><Icon name="out" className="h-4 w-4" /></button>
        </div>
      </div>
    </aside>
  );
}
