/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        godzilla: {
          cyan: '#06b6d4',
          neon: '#00f2ff',
          gold: '#f59e0b',
          amber: '#fbbf24',
          dark: '#0f172a',
          darker: '#020617',
        },
      },
    },
  },
  plugins: [],
};
