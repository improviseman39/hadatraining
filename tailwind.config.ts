import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#12181F",
        porcelain: "#F7F4EF",
        card: "#FFFFFF",
        // rgb()/<alpha-value> (not a raw hex var) so Tailwind's opacity
        // modifiers (bg-teal/10, border-teal/30, etc. — used ~100 places)
        // keep working with a runtime-set color.
        teal: {
          DEFAULT: "rgb(var(--color-teal-rgb) / <alpha-value>)",
          dark: "rgb(var(--color-teal-dark-rgb) / <alpha-value>)",
        },
        terracotta: "#C97B63",
        muted: "#6B6459",
      },
      fontFamily: {
        serif: ["var(--font-heading-active)", "Georgia", "serif"],
        sans: ["var(--font-body-active)", "Helvetica", "Arial", "sans-serif"],
      },
      maxWidth: {
        content: "1180px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
