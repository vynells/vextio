// The only bridge between the interface and the computer. Nothing else is exposed.
const { contextBridge, ipcRenderer } = require("electron");

const on = (channel) => (fn) => {
  const h = (_e, v) => fn(v);
  ipcRenderer.on(channel, h);
  return () => ipcRenderer.removeListener(channel, h);
};

contextBridge.exposeInMainWorld("vextio", {
  getConfig: () => ipcRenderer.invoke("config:get"),
  setConfig: (patch) => ipcRenderer.invoke("config:set", patch),
  login: (server, login, password) => ipcRenderer.invoke("auth:login", { server, login, password }),
  logout: () => ipcRenderer.invoke("auth:logout"),
  api: (method, route, body) => ipcRenderer.invoke("api", { method, route, body }),
  open: (url) => ipcRenderer.invoke("open", url),
  copy: (text) => ipcRenderer.invoke("copy", text),
  badge: (count, dataUrl) => ipcRenderer.invoke("badge", { count, dataUrl }),
  window: (cmd) => ipcRenderer.send("window", cmd),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  onMaximized: on("window:maximized"),
  onNavigate: on("navigate"),
  onRefresh: on("refresh"),
  onAction: on("action"),
  onSupport: on("support"),
  onOnline: on("online"),
  onSignedOut: on("signed-out"),
  onConfig: on("config"),
});
