// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          amber: "#E3A008",
          teal: "#0F6B5C",
          navy: "#1B2333",
          dark: "#111827", // Sakura-like dark sidebar
        },
      },
    },
  },
  plugins: [],
};
export default config;