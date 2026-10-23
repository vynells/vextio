import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { bridge, type Config, type Me } from "./bridge";
import Customers from "./screens/Customers";
import Login from "./screens/Login";
import OrderDrawer from "./screens/OrderDrawer";
import Orders, { type Filter } from "./screens/Orders";
import SettingsScreen from "./screens/Settings";
import Products from "./screens/Products";
import Stock from "./screens/Stock";
import Support from "./screens/Support";
import { needsAction, type Order } from "./status";
import { ease, Mark, Toasts, useKey, useToast } from "./ui/kit";
import Palette from "./ui/Palette";
import Sidebar, { type Screen } from "./ui/Sidebar";
import TitleBar from "./ui/TitleBar";

export default function App() {
  return <Toasts><Root /></Toasts>;
}

function Root() {
  const [config, setConfig] = useState<Config | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [boot, setBoot] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    bridge.getConfig().then(async (c) => {
      setConfig(c);
      if (c.signedIn) {
        const r = await bridge.api<{ me: Me }>("GET", "me");
        if (r.ok) setMe(r.data.me);
        else if (r.status === 0 && c.me) setMe(c.me); // offline: open anyway with what we know
      }
      setTimeout(() => setBoot(false), 450);
    });
    const offs = [
      bridge.onSignedOut((why) => { setMe(null); if (why === "expired") setNotice("You’ve been signed out. Please sign in again."); }),
      bridge.onConfig(setConfig),
    ];
    return () => offs.forEach((f) => f());
  }, []);

  return (
    <div className="flex h-full flex-col">
      <AnimatePresence mode="wait">
        {boot ? (
          <motion.div key="boot" className="flex h-full flex-col" exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <TitleBar />
            <div className="grid flex-1 place-items-center">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease }}><Mark className="h-10 w-auto" /></motion.div>
            </div>
          </motion.div>
        ) : me ? (
          <motion.div key="app" className="flex h-full flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Workspace me={me} config={config} setConfig={setConfig} onSignOut={async () => { await bridge.logout(); setMe(null); setNotice(""); }} />
          </motion.div>
        ) : (
          <motion.div key="login" className="flex h-full flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <TitleBar />
            <Login config={config} notice={notice} onDone={(m) => { setMe(m); setNotice(""); bridge.getConfig().then(setConfig); }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Workspace({ me, config, setConfig, onSignOut }: { me: Me; config: Config | null; setConfig: (c: Config) => void; onSignOut: () => void }) {
  const [screen, setScreen] = useState<Screen>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<Filter>("action");
  const [selected, setSelected] = useState<string | null>(null);
  const [palette, setPalette] = useState(false);
  const [seed, setSeed] = useState("");
  const [online, setOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [version, setVersion] = useState(0);
  const [support, setSupport] = useState(0);
  const toast = useToast();

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    const r = await bridge.api<{ orders: Order[] }>("GET", "orders");
    if (r.ok) {
      setOrders(r.data.orders); setOnline(true);
      setLoaded((was) => {
        if (!was && !r.data.orders.some((o) => needsAction(o.status))) setFilter("all");
        return true;
      });
    } else if (r.status === 0) setOnline(false);
    else if (manual) toast(r.data.error || "Couldn’t load orders.", "error");
    if (manual) setTimeout(() => setRefreshing(false), 400);
    setVersion((v) => v + 1);
  }, [toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const offs = [
      bridge.onRefresh(() => load()),
      bridge.onOnline(setOnline),
      bridge.onSupport(setSupport),
      bridge.onUpdate((u) => { if (u.state === "ready") toast(`Vextio Orders ${u.version} is ready.`, "info", { label: "Restart", run: () => bridge.installUpdate() }); }),
      bridge.onNavigate((route) => {
        if (route.startsWith("order:")) { setScreen("orders"); setSelected(route.slice(6)); load(); }
        else if (route === "orders:action") { setScreen("orders"); setFilter("action"); }
        else if (route === "support") { setScreen("support"); setSelected(null); }
      }),
    ];
    return () => offs.forEach((f) => f());
  }, [load, toast]);

  // Taskbar badge: a small lime square with the number of orders that need action.
  const action = orders.filter((o) => needsAction(o.status)).length;
  useEffect(() => {
    if (!action) { bridge.badge(0, ""); return; }
    const c = document.createElement("canvas"); c.width = c.height = 32;
    const x = c.getContext("2d")!;
    x.fillStyle = "#9cb832"; x.beginPath(); x.roundRect(1, 1, 30, 30, 8); x.fill();
    x.fillStyle = "#0a0a0a"; x.font = "bold 19px 'Segoe UI', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(action > 9 ? "9+" : String(action), 16, 17);
    bridge.badge(action, c.toDataURL());
  }, [action]);

  const go = (s: Screen) => { setScreen(s); setSelected(null); };
  useKey("mod+k", (e) => { e.preventDefault(); setPalette((p) => !p); });
  useKey("mod+1", () => go("orders"));
  useKey("mod+2", () => go("customers"));
  useKey("mod+3", () => go("products"));
  useKey("mod+4", () => go("stock"));
  useKey("mod+5", () => go("support"));
  useKey("mod+6", () => go("settings"));
  useKey("f5", (e) => { e.preventDefault(); load(true); }, [load]);
  useKey("mod+r", (e) => { e.preventDefault(); load(true); }, [load]);

  return (
    <>
      <TitleBar online={online} onSearch={() => setPalette(true)} onRefresh={() => load(true)} refreshing={refreshing} />
      <div className="flex min-h-0 flex-1">
        <Sidebar screen={screen} go={go} action={action} support={support} me={me} onSignOut={onSignOut} onOpenShop={() => config && bridge.open(config.server + "/shop")} />
        <main className="relative min-w-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={screen} className="h-full" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease }}>
              {screen === "orders" && <Orders me={me} orders={orders} loaded={loaded} filter={filter} setFilter={setFilter} selected={selected} open={setSelected} />}
              {screen === "customers" && <Customers version={version} onFindOrders={(email) => { setSeed(email); setPalette(true); }} />}
              {screen === "products" && <Products version={version} />}
              {screen === "stock" && <Stock version={version} />}
              {screen === "support" && <Support version={version} onChanged={() => load()} />}
              {screen === "settings" && <SettingsScreen config={config} setConfig={setConfig} onSignOut={onSignOut} />}
            </motion.div>
          </AnimatePresence>
          <OrderDrawer number={selected} onClose={() => setSelected(null)} onChanged={() => load()} />
        </main>
      </div>
      <Palette open={palette} seed={seed} onClose={() => { setPalette(false); setSeed(""); }} orders={orders} go={go} openOrder={(n) => { setScreen("orders"); setSelected(n); }} />
    </>
  );
}
