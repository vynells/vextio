// Everything the interface needs from the computer, through the preload bridge.
// In a plain browser (`npm run web`), a small stand-in talks to the website directly.

export type Me = { id: number; login: string; name: string; role: "owner" | "staff" };
export type Config = { server: string; notify: boolean; sound: boolean; closeToTray: boolean; openAtLogin: boolean; signedIn: boolean; me: Me | null; version: string; platform: string };
export type Update = { state: "idle" | "dev" | "checking" | "current" | "downloading" | "ready" | "error"; version?: string; percent?: number; message?: string; checkedAt?: number };
export type ApiResult<T = any> = { ok: boolean; status: number; data: T & { error?: string; fields?: Record<string, string>; ok?: string } };
type Off = () => void;

export type Bridge = {
  getConfig(): Promise<Config>;
  setConfig(p: Partial<Config>): Promise<Config>;
  login(server: string, login: string, password: string): Promise<ApiResult<{ token: string; me: Me }>>;
  logout(): Promise<boolean>;
  api<T = any>(method: "GET" | "POST", route: string, body?: unknown): Promise<ApiResult<T>>;
  open(url: string): Promise<void>;
  copy(text: string): Promise<boolean>;
  badge(count: number, dataUrl: string): Promise<void>;
  window(cmd: "minimize" | "maximize" | "close"): void;
  isMaximized(): Promise<boolean>;
  onMaximized(fn: (v: boolean) => void): Off;
  onNavigate(fn: (route: string) => void): Off;
  onRefresh(fn: () => void): Off;
  onAction(fn: (n: number) => void): Off;
  onSupport(fn: (n: number) => void): Off;
  onOnline(fn: (v: boolean) => void): Off;
  onSignedOut(fn: (why?: string) => void): Off;
  onConfig(fn: (c: Config) => void): Off;
  getUpdate(): Promise<Update>;
  checkUpdate(): Promise<Update>;
  installUpdate(): Promise<void>;
  onUpdate(fn: (u: Update) => void): Off;
};

function browserBridge(): Bridge {
  const store = { get: (k: string) => localStorage.getItem("vextio:" + k), set: (k: string, v: string) => localStorage.setItem("vextio:" + k, v), del: (k: string) => localStorage.removeItem("vextio:" + k) };
  const listeners: Record<string, Set<(v: any) => void>> = {};
  const on = (ch: string) => (fn: (v: any) => void) => { (listeners[ch] ??= new Set()).add(fn); return () => listeners[ch].delete(fn); };
  const emit = (ch: string, v?: unknown) => listeners[ch]?.forEach((f) => f(v));
  const cfg = (): Config => ({
    server: location.origin, notify: true, sound: true, closeToTray: true, openAtLogin: false, signedIn: !!store.get("token"),
    me: JSON.parse(store.get("me") || "null"), version: "web preview", platform: "web",
  });
  const call = async (method: string, route: string, body?: unknown) => {
    try {
      const token = store.get("token");
      const r = await fetch(`/api/app/${route}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: method === "GET" ? undefined : JSON.stringify(body ?? {}) });
      const data = await r.json().catch(() => ({ error: `Server answered ${r.status}` }));
      if (r.status === 401 && route !== "login") { store.del("token"); emit("signed-out", "expired"); }
      return { ok: r.ok, status: r.status, data };
    } catch { return { ok: false, status: 0, data: { error: "Can’t reach the server." } }; }
  };
  setInterval(() => store.get("token") && emit("refresh"), 20000);
  return {
    getConfig: async () => cfg(),
    setConfig: async () => cfg(),
    login: async (_s, login, password) => {
      const r = await call("POST", "login", { login, password });
      if (r.ok) { store.set("token", r.data.token); store.set("me", JSON.stringify(r.data.me)); }
      return r;
    },
    logout: async () => { store.del("token"); store.del("me"); return true; },
    api: call as Bridge["api"],
    open: async (url) => { window.open(url, "_blank"); },
    copy: async (t) => { await navigator.clipboard?.writeText(t).catch(() => {}); return true; },
    badge: async () => {},
    window: () => {},
    isMaximized: async () => false,
    onMaximized: on("max"), onNavigate: on("nav"), onRefresh: on("refresh"), onAction: on("action"), onSupport: on("support"),
    onOnline: on("online"), onSignedOut: on("signed-out"), onConfig: on("config"),
    getUpdate: async () => ({ state: "dev" }), checkUpdate: async () => ({ state: "dev" }), installUpdate: async () => {}, onUpdate: on("update"),
  };
}

export const bridge: Bridge = (window as unknown as { vextio?: Bridge }).vextio ?? browserBridge();
export const isDesktop = !!(window as unknown as { vextio?: Bridge }).vextio;
