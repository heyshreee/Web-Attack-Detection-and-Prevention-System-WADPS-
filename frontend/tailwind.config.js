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
          bg: 'var(--color-background)',
          card: 'var(--color-surface)',
          border: 'var(--color-border)',
          text: 'var(--color-text)',
          muted: 'var(--color-muted)',
          accent: 'var(--color-accent)',
          primary: 'var(--color-primary)',
          danger: '#ff0055',
          success: '#10b981',
          warning: '#f59e0b',
        },
        cyan: {
          50: '#E6FFF5',
          100: '#CCFFE6',
          200: '#99FFCD',
          300: '#66FFAF',
          400: '#33FF91',
          500: '#00FFA3',
          600: '#00E692',
          700: '#00B371',
          800: '#008051',
          900: '#004D31',
          950: '#003320',
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(0, 255, 163, 0.3)',
        'neon-danger': '0 0 10px rgba(255, 0, 85, 0.3)',
      }
    },
  },
  plugins: [],
}
