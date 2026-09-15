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
          // PRODUCT.md brand commitments: S+ gold/crimson, S vibrant purple,
          // A cyan, B emerald, C amber, D muted slate.
          's-plus': '#ff0055',
          's': '#8b5cf6',
          'a': '#06b6d4',
          'b': '#10b981',
          'c': '#f59e0b',
          'd': '#475569',
        },
      },
    },
  },
  plugins: [],
}
