import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px" },
    extend: {
      colors: {
        // Ground and type: a two-colour print job, bottle green and gold.
        green: { DEFAULT: "#133621", 2: "#1a4429", 3: "#22532f", deep: "#0d2817" },
        gold: { DEFAULT: "#f4d96c", soft: "#d6c675" },
        // The stationery the page is printed on.
        paper: { DEFAULT: "#f6eedb", 2: "#ece0c2" },
        // Paint colours: used on the shirts and the folder tabs, never for running text.
        coral: "#e2553c",
        river: "#2f78b7",
        sky: "#9cc6e4",
        rose: "#f0a0b8",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      fontSize: {
        // Five steps. Nothing else is used on the site.
        small: ["0.875rem", { lineHeight: "1.4" }],
        body: ["clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem)", { lineHeight: "1.5" }],
        lead: ["clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem)", { lineHeight: "1.35" }],
        head: ["clamp(3rem, 1.6rem + 6vw, 6.5rem)", { lineHeight: "0.88", letterSpacing: "-0.01em" }],
        giant: ["clamp(4.5rem, 1.5rem + 15vw, 15rem)", { lineHeight: "0.82", letterSpacing: "-0.02em" }],
      },
      transitionTimingFunction: { out: "cubic-bezier(0.22, 1, 0.36, 1)" },
    },
  },
  plugins: [],
} satisfies Config;
