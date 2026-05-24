import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
      },
      colors: {
        neuro: {
          primary: '#8b5cf6',
          accent: '#c026d3',
          dark: '#09090b',
        },
        rebel: {
          primary: '#ef4444',
          accent: '#f87171',
        }
      },
      animation: {
        'neuro-pulse': 'neuroPulse 4s ease-in-out infinite',
        'rebel-flicker': 'rebelFlicker 0.8s ease-in-out infinite',
      },
      keyframes: {
        neuroPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        rebelFlicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        }
      },
      boxShadow: {
        'neuro': '0 25px 50px -12px rgb(139 92 246 / 0.25)',
        'rebel': '0 25px 50px -12px rgb(239 68 68 / 0.3)',
      }
    },
  },
  plugins: [],
};

export default config;
