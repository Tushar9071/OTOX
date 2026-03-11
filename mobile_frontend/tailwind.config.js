/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#F97316",
        "primary-dark": "#EA580C",
        background: "#FFFFFF",
        surface: "#F9FAFB",
        "text-primary": "#111827",
        "text-secondary": "#6B7280",
      },
    },
  },
  plugins: [],
};
