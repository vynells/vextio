import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src/renderer",
  base: "./",
  plugins: [react()],
  build: { outDir: "../../dist", emptyOutDir: true, target: "chrome128" },
  // `npm run web` previews the interface in a browser against a local copy of the website.
  server: { proxy: { "/api": process.env.P4P_SERVER || "http://localhost:3100" } },
});
