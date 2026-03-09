import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "energy-dark": "#0f172a",
        "energy-blue": "#0ea5e9",
        "energy-green": "#10b981",
      },
    },
  },
  plugins: [],
};
export default config;
