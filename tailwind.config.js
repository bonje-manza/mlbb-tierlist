/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        cyber: {
          ground: '#09090b',
          card: '#111114',
          surface: '#141418',
          elevated: '#1a1a20',
          border: '#222226',
          muted: '#a1a1aa',
        },
        tier: {
          's-plus': '#f43f5e',
          's': '#818cf8',
          'a': '#06b6d4',
          'b': '#10b981',
          'c': '#f59e0b',
          'd': '#52525b',
        },
        ban: {
          maroon: '#881337',
          rose: '#fda4af',
        },
      },
    },
  },
  plugins: [],
}
