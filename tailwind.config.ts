import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'apple-gray': '#86868B',
        'apple-gray-dark': '#1D1D1F',
        'apple-gray-light': '#F5F5F7',
        'apple-blue': '#007AFF',
        'background-light': '#FBFBFD',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      transitionProperty: {
        'apple': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'apple': '300ms',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
export default config;

