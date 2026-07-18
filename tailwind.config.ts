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
        teal: {
          DEFAULT: "#3D6B66",
          dark: "#2E5450",
        },
        terracotta: "#C97B63",
        muted: "#6B6459",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Helvetica", "Arial", "sans-serif"],
      },
      maxWidth: {
        content: "1180px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
