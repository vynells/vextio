// Vextio Orders, the desktop app. The main process owns the window, the tray, Windows
// notifications and all network calls; the interface lives in dist/ and talks to it over IPC.
const { app, BrowserWindow, ipcMain, Tray, Menu, Notification, nativeImage, shell, clipboard, safeStorage, screen } = require("electron");
const fs = require("fs");
const path = require("path");

const DEFAULT_SERVER = "https://vextio.vercel.app";
const POLL_MS = 20_000;
const dev = !app.isPackaged && process.env.VEXTIO_DEV === "1";

app.setAppUserModelId("com.vextio.orders");
if (!app.requestSingleInstanceLock()) app.quit();

// ---------- Settings on disk ----------
const configFile = () => path.join(app.getPath("userData"), "config.json");
let config = { server: DEFAULT_SERVER, token: "", notify: true, sound: true, closeToTray: true, openAtLogin: false, bounds: null, trayHintShown: false, me: null };
function loadConfig() {
  try { config = { ...config, ...JSON.parse(fs.readFileSync(configFile(), "utf8")) }; } catch {}
  if (process.env.VEXTIO_SERVER) config.server = process.env.VEXTIO_SERVER;
}
function saveConfig() {
  try { fs.mkdirSync(path.dirname(configFile()), { recursive: true }); fs.writeFileSync(configFile(), JSON.stringify(config, null, 2)); } catch {}
}
// The sign-in token is encrypted with Windows' own credential protection when available.
function setToken(t) {
  config.token = t ? (safeStorage.isEncryptionAvailable() ? "enc:" + safeStorage.encryptString(t).toString("base64") : t) : "";
  saveConfig();
}
function getToken() {
  if (!config.token) return "";
  if (config.token.startsWith("enc:")) {
    try { return safeStorage.decryptString(Buffer.from(config.token.slice(4), "base64")); } catch { return ""; }
  }
  return config.token;
}

// ---------- Talking to the website ----------
async function api(method, route, body) {
  const token = getToken();
  try {
    const res = await fetch(`${config.server.replace(/\/$/, "")}/api/app/${route}`, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
      signal: AbortSignal.timeout(20_000),
    });
    const data = await res.json().catch(() => ({ error: `The server answered ${res.status}.` }));
    if (res.status === 401 && route !== "login") signOut(false);
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "Can’t reach the server. Check your internet connection." } };
  }
}

// ---------- Window ----------
let win = null, tray = null, quitting = false, action = 0, support = 0;

function createWindow() {
  const b = config.bounds;
  const onScreen = b && screen.getAllDisplays().some((d) => b.x >= d.bounds.x - 50 && b.y >= d.bounds.y - 50 && b.x < d.bounds.x + d.bounds.width && b.y < d.bounds.y + d.bounds.height);
  win = new BrowserWindow({
    width: b?.width ?? 1280, height: b?.height ?? 820, x: onScreen ? b.x : undefined, y: onScreen ? b.y : undefined,
    minWidth: 960, minHeight: 620, frame: false, show: false, backgroundColor: "#0a0a0a",
    title: "Vextio Orders", icon: path.join(__dirname, "../../build/icon.png"),
    webPreferences: { preload: path.join(__dirname, "preload.cjs"), contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: true, devTools: dev },
  });
  if (b?.maximized) win.maximize();
  win.loadFile(path.join(__dirname, "../../dist/index.html"));
  win.once("ready-to-show", () => { if (!process.argv.includes("--hidden")) win.show(); });

  const remember = () => {
    if (!win || win.isMinimized()) return;
    config.bounds = { ...(win.isMaximized() ? config.bounds ?? {} : win.getBounds()), maximized: win.isMaximized() };
    saveConfig();
  };
  win.on("resize", remember);
  win.on("move", remember);
  win.on("maximize", () => { send("window:maximized", true); remember(); });
  win.on("unmaximize", () => { send("window:maximized", false); remember(); });
  win.on("focus", () => win.flashFrame(false));
  win.on("close", (e) => {
    if (quitting || !config.closeToTray || !getToken()) return;
    e.preventDefault();
    win.hide();
    if (!config.trayHintShown && Notification.isSupported()) {
      new Notification({ title: "Vextio Orders is still running", body: "It’s in the tray by the clock and will tell you about new orders. Right-click it to quit.", icon: iconPath() }).show();
      config.trayHintShown = true; saveConfig();
    }
  });

  // Links open in the browser, never inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => { openExternal(url); return { action: "deny" }; });
  win.webContents.on("will-navigate", (e, url) => { if (!url.startsWith("file://")) { e.preventDefault(); openExternal(url); } });
}

const iconPath = () => path.join(__dirname, "../../build/icon.png");
const send = (ch, payload) => win && !win.isDestroyed() && win.webContents.send(ch, payload);
function show(route) {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show(); win.focus();
  if (route) send("navigate", route);
}
function openExternal(url) {
  if (/^(https?:|mailto:|tel:)/i.test(url)) shell.openExternal(url);
}

// ---------- Tray ----------
function createTray() {
  const img = nativeImage.createFromPath(path.join(__dirname, "../../build/tray.png"));
  const hi = path.join(__dirname, "../../build/tray@2x.png");
  if (fs.existsSync(hi)) img.addRepresentation({ scaleFactor: 2, buffer: fs.readFileSync(hi) });
  tray = new Tray(img);
  tray.on("click", () => show());
  updateTray();
}
function updateTray() {
  if (!tray) return;
  tray.setToolTip(action ? `Vextio Orders · ${action} need${action === 1 ? "s" : ""} action` : "Vextio Orders");
  const supportItem = support ? [{ label: `${support} support message${support === 1 ? "" : "s"}`, click: () => show("support") }] : [];
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Open Vextio Orders", click: () => show() },
    { label: action ? `${action} order${action === 1 ? "" : "s"} need${action === 1 ? "s" : ""} action` : "All caught up", enabled: !!action, click: () => show("orders:action") },
    ...supportItem,
    { type: "separator" },
    { label: "Notifications", type: "checkbox", checked: config.notify, click: (i) => { config.notify = i.checked; saveConfig(); send("config", publicConfig()); } },
    { type: "separator" },
    ...(update.state === "ready" ? [{ label: `Restart to update to ${update.version}`, click: () => { quitting = true; updater.quitAndInstall(false, true); } }] : []),
    { label: "Quit Vextio Orders", click: () => { quitting = true; app.quit(); } },
  ]));
}

// ---------- Watching for new orders and support messages ----------
let seen = null, seenMessages = null, timer = null;
const pkr = (n) => "PKR " + Math.round(n).toLocaleString("en-US");
async function poll() {
  if (!getToken()) return;
  const r = await api("GET", "pulse");
  if (!r.ok) { send("online", r.status !== 0); return; }
  send("online", true);
  const { recent, action: n, support: openSupport, messages } = r.data;
  if (n !== action || openSupport !== support) { action = n; support = openSupport; updateTray(); send("action", n); send("support", openSupport); }
  const now = new Map(recent.map((o) => [o.number, o.status]));
  const nowMessages = new Set(messages.map((m) => m.id));
  if (seen) {
    const alerts = [];
    for (const o of recent) {
      if (seen.has(o.number)) continue;
      const verb = o.status === "pending" ? "Check the payment" : "Ready to ship";
      alerts.push({ route: `order:${o.number}`, title: `New order #${o.number}`, body: `${o.name} ordered ${o.items} · ${pkr(o.total)}. ${verb}.` });
    }
    for (const m of messages) {
      if (seenMessages.has(m.id)) continue;
      alerts.push({ route: "support", title: `Support · ${m.from_name || m.from_email}`, body: m.subject || "New message" });
    }
    if (alerts.length) {
      send("refresh");
      if (win && !win.isFocused()) win.flashFrame(true);
      if (config.notify && Notification.isSupported()) {
        for (const a of alerts.slice(0, 3)) {
          const note = new Notification({ title: a.title, body: a.body, icon: iconPath(), silent: !config.sound });
          note.on("click", () => show(a.route));
          note.show();
        }
      }
    } else {
      // Something else changed (a teammate updated an order): keep the screen current.
      for (const [k, v] of now) if (seen.get(k) !== v) { send("refresh"); break; }
    }
  }
  seen = now;
  seenMessages = nowMessages;
}
function startPolling() {
  stopPolling();
  seen = null;
  poll();
  timer = setInterval(poll, POLL_MS);
}
function stopPolling() { if (timer) clearInterval(timer); timer = null; }

function signOut(notify = true) {
  setToken("");
  config.me = null; saveConfig();
  stopPolling();
  action = 0; support = 0; updateTray();
  if (win) win.setOverlayIcon(null, "");
  if (notify !== false) send("signed-out");
  else send("signed-out", "expired");
}

const publicConfig = () => ({
  server: config.server, notify: config.notify, sound: config.sound, closeToTray: config.closeToTray, openAtLogin: config.openAtLogin,
  signedIn: !!getToken(), me: config.me, version: app.getVersion(), platform: process.platform,
});

// ---------- IPC ----------
ipcMain.handle("config:get", () => publicConfig());
ipcMain.handle("config:set", (_e, patch) => {
  for (const k of ["notify", "sound", "closeToTray", "openAtLogin"]) if (typeof patch?.[k] === "boolean") config[k] = patch[k];
  if (typeof patch?.openAtLogin === "boolean") app.setLoginItemSettings({ openAtLogin: patch.openAtLogin, args: ["--hidden"] });
  saveConfig(); updateTray();
  return publicConfig();
});
ipcMain.handle("auth:login", async (_e, { server, login, password }) => {
  if (server) {
    const s = String(server).trim().replace(/\/$/, "");
    if (!/^https?:\/\/[^\s]+$/.test(s)) return { ok: false, data: { error: "The server address should start with https://" } };
    config.server = s;
  }
  const r = await api("POST", "login", { login, password });
  if (r.ok) { setToken(r.data.token); config.me = r.data.me; saveConfig(); startPolling(); }
  return r;
});
ipcMain.handle("auth:logout", () => { signOut(true); return true; });
ipcMain.handle("api", async (_e, { method, route, body }) => {
  if (typeof route !== "string" || route.includes("..") || route === "login") return { ok: false, data: { error: "Bad request." } };
  const r = await api(method === "POST" ? "POST" : "GET", route, body);
  if (route === "password" && r.ok && r.data.token) setToken(r.data.token);
  if (method === "POST" && r.ok) setTimeout(poll, 300);
  return r;
});
ipcMain.handle("open", (_e, url) => openExternal(String(url)));
ipcMain.handle("copy", (_e, text) => { clipboard.writeText(String(text)); return true; });
ipcMain.handle("badge", (_e, { count, dataUrl }) => {
  if (!win) return;
  if (!count) win.setOverlayIcon(null, "");
  else win.setOverlayIcon(nativeImage.createFromDataURL(dataUrl), `${count} need action`);
});
ipcMain.on("window", (_e, cmd) => {
  if (!win) return;
  if (cmd === "minimize") win.minimize();
  else if (cmd === "maximize") (win.isMaximized() ? win.unmaximize() : win.maximize());
  else if (cmd === "close") win.close();
});
ipcMain.handle("window:isMaximized", () => !!win?.isMaximized());

// ---------- Updates ----------
// New versions are published as GitHub releases. The app checks on start and every few hours,
// downloads in the background, and installs when it restarts.
let updater = null, update = { state: "idle" };
function setUpdate(next) { update = next; send("update", update); updateTray(); }
function setupUpdates() {
  if (!app.isPackaged) { update = { state: "dev" }; return; }
  try { updater = require("electron-updater").autoUpdater; } catch { return; }
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = true;
  updater.on("checking-for-update", () => setUpdate({ state: "checking" }));
  updater.on("update-not-available", () => setUpdate({ state: "current", checkedAt: Date.now() }));
  updater.on("update-available", (i) => setUpdate({ state: "downloading", version: i.version, percent: 0 }));
  updater.on("download-progress", (p) => setUpdate({ ...update, state: "downloading", percent: Math.round(p.percent) }));
  updater.on("update-downloaded", (i) => {
    setUpdate({ state: "ready", version: i.version });
    if (Notification.isSupported()) {
      const note = new Notification({ title: `Vextio Orders ${i.version} is ready`, body: "Restart the app to finish updating. It also installs next time you quit.", icon: iconPath() });
      note.on("click", () => show());
      note.show();
    }
  });
  updater.on("error", (e) => setUpdate({ state: "error", message: String(e?.message || e).split(/\r?\n/)[0].slice(0, 200) }));
  const check = () => updater.checkForUpdates().catch(() => {});
  setTimeout(check, 8_000);
  setInterval(check, 4 * 3600_000);
}
ipcMain.handle("update:get", () => update);
ipcMain.handle("update:check", () => { if (updater) updater.checkForUpdates().catch(() => {}); return update; });
ipcMain.handle("update:install", () => { if (updater && update.state === "ready") { quitting = true; updater.quitAndInstall(false, true); } });

// ---------- Life cycle ----------
app.on("second-instance", () => show());
app.on("before-quit", () => { quitting = true; });
app.whenReady().then(() => {
  loadConfig();
  Menu.setApplicationMenu(null);
  createWindow();
  createTray();
  setupUpdates();
  if (getToken()) startPolling();
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
