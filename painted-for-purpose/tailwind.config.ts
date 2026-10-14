import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FBF7EF",
        ink: "#1B1A17",
        leaf: "#0B6B3A",
        river: "#1F6FB2",
        marigold: "#F2A900",
        coral: "#E8553E",
        lilac: "#8E6CCF",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        hand: ["var(--font-hand)", "cursive"],
      },
    },
  },
  plugins: [],
} satisfies Config;
