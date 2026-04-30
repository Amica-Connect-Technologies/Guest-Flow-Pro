import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  "#e8edf5",
          100: "#c5d0e6",
          200: "#9fb0d4",
          300: "#7890c2",
          400: "#5a78b5",
          500: "#3c60a8",
          600: "#2a4d8f",
          700: "#1a3870",
          800: "#0e2554",
          900: "#06163a",
          950: "#030c22",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(135deg, #030c22 0%, #0e2554 40%, #1a3870 70%, #1d4ed8 100%)",
        "card-gradient":
          "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)",
        "section-gradient":
          "linear-gradient(180deg, #f0f6ff 0%, #ffffff 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
