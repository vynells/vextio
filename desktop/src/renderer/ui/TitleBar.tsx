import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { bridge } from "../bridge";
import { Icon, Mark } from "./kit";

/** Our own title bar: drag to move, Windows-style controls on the right. */
export default function TitleBar({ online = true, onSearch, onRefresh, refreshing }: { online?: boolean; onSearch?: () => void; onRefresh?: () => void; refreshing?: boolean }) {
  const [max, setMax] = useState(false);
  useEffect(() => { bridge.isMaximized().then(setMax); return bridge.onMaximized(setMax); }, []);
  return (
    <header className="drag relative z-40 flex h-10 shrink-0 items-center border-b border-line bg-side" onDoubleClick={() => bridge.window("maximize")}>
      <div className="flex w-[232px] items-center gap-2.5 pl-4">
        <Mark className="h-[18px] w-auto" />
        <span className="font-display text-[13px] font-bold tracking-tight">Vextio Orders</span>
      </div>
      {onSearch && (
        <button type="button" onClick={onSearch} className="no-drag mx-auto flex h-7 w-[min(420px,40vw)] items-center gap-2 rounded-lg bg-white/[0.04] px-3 text-[12.5px] text-ink-muted ring-1 ring-line transition hover:bg-white/[0.07] active:scale-[0.99]">
          <Icon name="search" className="h-3.5 w-3.5" />Search orders, customers…<span className="kbd ml-auto">Ctrl K</span>
        </button>
      )}
      <div className="no-drag ml-auto flex h-full items-center">
        {!online && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mr-2 flex items-center gap-1.5 rounded-md bg-coral/15 px-2 py-1 text-[11.5px] font-semibold text-coral">
            <Icon name="wifiOff" className="h-3.5 w-3.5" />Offline
          </motion.span>
        )}
        {onRefresh && (
          <button type="button" onClick={onRefresh} title="Refresh (F5)" aria-label="Refresh" className="mr-1 grid h-8 w-8 place-items-center rounded-md text-ink-muted transition hover:bg-white/[0.06] hover:text-ink active:scale-90">
            <motion.span animate={{ rotate: refreshing ? 360 : 0 }} transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : { duration: 0 }}><Icon name="refresh" className="h-4 w-4" /></motion.span>
          </button>
        )}
        <>
            <WinButton label="Minimize" onClick={() => bridge.window("minimize")}><path d="M1 5.5h9" /></WinButton>
            <WinButton label={max ? "Restore" : "Maximize"} onClick={() => bridge.window("maximize")}>
              {max ? <><rect x="1" y="3" width="7" height="7" /><path d="M3 3V1h7v7H8" /></> : <rect x="1" y="1" width="9" height="9" />}
            </WinButton>
            <WinButton label="Close" danger onClick={() => bridge.window("close")}><path d="M1 1l9 9M10 1l-9 9" /></WinButton>
          </>
      </div>
    </header>
  );
}

function WinButton({ label, danger, onClick, children }: { label: string; danger?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick}
      className={`grid h-10 w-[46px] place-items-center text-ink-body transition-colors ${danger ? "hover:bg-[#c42b1c] hover:text-white" : "hover:bg-white/[0.07]"}`}>
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1">{children}</svg>
    </button>
  );
}
