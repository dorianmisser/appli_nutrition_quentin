import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#c41732", dark: "#9c1228", soft: "#fbe9ec" },
        ink: "#1a1a1a",
        muted: "#666666",
        line: "#d6d6d3",
        paper: "#ffffff",
        canvas: "#f2f2f0",
        fog: "#ebeaea",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      borderRadius: { DEFAULT: "4px" },
    },
  },
  plugins: [],
};
export default config;
