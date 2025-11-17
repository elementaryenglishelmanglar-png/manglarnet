import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Colores funcionales (mantener para grados y asignaturas)
        'brand-primary': '#78AC40',
        'brand-secondary': '#FADB16',
        // Paleta monocromática Apple (compatibilidad)
        'apple-white': '#FFFFFF',
        'apple-gray-light': '#F5F5F7',
        'apple-gray': '#86868B',
        'apple-gray-dark': '#1D1D1F',
        'apple-blue': '#007AFF',
        'apple-red': '#FF3B30',
        'apple-green': '#34C759',
        // Compatibilidad con código existente
        'background-dark': '#1D1D1F',
        'background-light': '#F5F5F7',
        'text-main': '#1D1D1F',
        'text-secondary': '#86868B',
        'brand-gray': '#B0B4B7',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Compatibilidad
        'xs': '4px',
        'xl': '20px',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'large': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'brand': '0 4px 6px -1px rgba(120, 172, 64, 0.1), 0 2px 4px -1px rgba(120, 172, 64, 0.06)',
        'brand-lg': '0 10px 15px -3px rgba(120, 172, 64, 0.1), 0 4px 6px -2px rgba(120, 172, 64, 0.05)',
      },
      transitionProperty: {
        'apple': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
        'apple': '300ms',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

