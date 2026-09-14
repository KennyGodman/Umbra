/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        umbra: {
          dark: "#08040e",
          midnight: "#0e071a",
          card: "#130a24",
          surface: "#1a0d33",
          border: "#2d1654",
          purpleDark: "#1f0938",
          purpleMid: "#3b126b",
          purpleLight: "#6b21a8",
          neon: "#a855f7",
          glow: "#c084fc",
          white: "#ffffff"
        },
        guard: {
          dark: "#0a0f1d",
          navy: "#0f172a",
          surface: "#1e293b",
          border: "#334155",
          accent: "#a855f7",
          accentHover: "#9333ea",
          slate: "#64748b",
          light: "#f8fafc",
          cyan: "#38bdf8"
        }
      },
      boxShadow: {
        'purple-glow': '0 0 25px -5px rgba(168, 85, 247, 0.35)',
        'purple-card': '0 10px 30px -10px rgba(14, 7, 26, 0.8), 0 0 1px 1px rgba(168, 85, 247, 0.15)',
        'btn-white': '0 4px 15px rgba(255, 255, 255, 0.25), 0 2px 4px rgba(0, 0, 0, 0.4)',
        'btn-purple': '0 4px 20px rgba(59, 18, 107, 0.5), 0 0 12px rgba(168, 85, 247, 0.3)'
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Arial',
          'sans-serif',
        ],
      },
      animation: {
        'roll': 'roll 1.5s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        roll: {
          '0%': { transform: 'translateX(-40px) rotate(0deg)' },
          '50%': { transform: 'translateX(40px) rotate(360deg)' },
          '100%': { transform: 'translateX(-40px) rotate(720deg)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        }
      }
    },
  },
  plugins: [],
}
