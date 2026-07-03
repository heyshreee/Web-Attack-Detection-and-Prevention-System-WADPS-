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
          bg: '#0a0f1d',
          card: '#131b2e',
          border: '#1f2d4d',
          text: '#e2e8f0',
          muted: '#94a3b8',
          accent: '#00f0ff',
          primary: '#3b82f6',
          danger: '#ff0055',
          success: '#10b981',
          warning: '#f59e0b',
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(0, 240, 255, 0.3)',
        'neon-danger': '0 0 10px rgba(255, 0, 85, 0.3)',
      }
    },
  },
  plugins: [],
}
