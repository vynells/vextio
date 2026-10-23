/** @type {import('tailwindcss').Config} */
// Vextio's punk / Y2K palette: near-black, bone white, blood red and acid lime.
// The token names are shared with the components: `pink` is the main accent, `blue` the second one.
module.exports = {
  content: ["./src/renderer/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a", side: "#0d0d0d", surface: "#141414", raised: "#1c1c1c", line: "rgba(237,235,230,0.08)",
        ink: { DEFAULT: "#edebe6", body: "#c9c6bf", muted: "#8a8782" },
        paper: "#edebe6", night: "#0a0a0a",
        pink: "#9cb832", blue: "#e0524f", lavender: "#c9a7e8", ochre: "#e8b94a", mint: "#9cb832", coral: "#ff5a4f", sky: "#8fc4e8",
      },
      fontFamily: {
        display: ["Anton", "Impact", "sans-serif"],
        sans: ["Segoe UI Variable Text", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["Cascadia Mono", "Consolas", "ui-monospace", "monospace"],
      },
      borderRadius: { md: "3px", lg: "4px", xl: "6px", "2xl": "8px" },
      boxShadow: { pop: "4px 4px 0 0 rgba(194,59,59,.9), 0 24px 60px -16px rgba(0,0,0,.8)" },
    },
  },
  plugins: [],
};
