/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#0b1120",
          800: "#111827",
          700: "#161d2e",
          600: "#1e2a3b",
        },
      },
    },
  },
  plugins: [],
}
