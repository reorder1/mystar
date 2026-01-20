import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-outfit)", "sans-serif"],
        body: ["var(--font-jakarta)", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 20px rgba(251, 191, 36, 0.45)"
      }
    }
  },
  plugins: []
};

export default config;
