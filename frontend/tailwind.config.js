import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        soul: {
          cyan: "#22d3ee",
          purple: "#c026d3",
          rebel: "#ef4444",
          calm: "#22c55e",
        },
      },
      animation: {
        "radar-spin": "spin 20s linear infinite",
        "soul-glow": "soulGlow 2s ease-in-out infinite",
      },
      keyframes: {
        soulGlow: {
          "0%, 100%": { opacity: "0.8", filter: "brightness(1)" },
          "50%": { opacity: "1", filter: "brightness(1.3)" },
        }
      }
    },
  },
  plugins: [],
};

export default config;
