import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Storybook palette. Named so intent reads in the markup.
        parchment: {
          DEFAULT: "#F4EADA",
          deep: "#EADFC8",
          card: "#FFFCF5",
          warm: "#FBF4E6",
        },
        teal: {
          DEFAULT: "#1F4E4A",
          deep: "#16403C",
          soft: "#2C6560",
        },
        olive: {
          DEFAULT: "#585C36",
          deep: "#474A2B",
        },
        terracotta: {
          DEFAULT: "#C0663A",
          deep: "#A5522C",
          ink: "#9A4B25",
          soft: "#D98A5E",
        },
        ink: "#23423C",
        bodytext: "#4A5A52",
        muted: {
          DEFAULT: "#596661",
          foreground: "#596661",
        },
        ondark: {
          DEFAULT: "#F6EEDF",
          muted: "#C4D3C9",
        },
        line: {
          DEFAULT: "#DDCFB4",
          soft: "#E8DDC6",
        },
        gold: "#C79A4B",
        blush: "#D99A86",

        // shadcn-style aliases retained for existing utility usage
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        accent: {
          DEFAULT: "var(--terracotta)",
          foreground: "var(--on-dark)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        blob: "42% 58% 63% 37% / 45% 40% 60% 55%",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "Times New Roman", "serif"],
        serif: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 10px -4px rgba(90, 74, 48, 0.10)",
        lift: "0 12px 30px -14px rgba(90, 74, 48, 0.30)",
        panel: "0 20px 50px -28px rgba(31, 78, 74, 0.45)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        floatSoft: {
          "0%,100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(1.5deg)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        "float-soft": "floatSoft 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
