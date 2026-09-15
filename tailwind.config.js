/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          ground: '#0b0f19',
          card: '#131b2e',
          surface: '#131b2e',
          border: '#1e293b',
          muted: '#94a3b8',
        },
        tier: {
          's-plus': '#ff0055',
          's': '#f59e0b',
          'a': '#8b5cf6',
          'b': '#06b6d4',
          'c': '#64748b',
          'd': '#475569',
        },
      },
    },
  },
  plugins: [],
}
