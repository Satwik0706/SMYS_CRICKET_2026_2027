/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnight: {
          900: '#060B1C',
          DEFAULT: '#0B1535',
          800: '#0F1E4A',
          700: '#142B59',
        },
        navy: {
          deep: '#142B59',
          dark: '#0B1535',
        },
        electric: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#3B82F6',
        },
        royal: {
          DEFAULT: '#7048E8',
          dark: '#5B37C2',
          light: '#8B68F5',
        },
        gold: {
          DEFAULT: '#F5B82E',
          hover: '#DDA01A',
          light: '#FDE047',
          dark: '#B45309',
        },
        surface: {
          light: '#F4F7FC',
          card: '#FFFFFF',
          darkCard: '#111C44',
          darkBorder: '#1E2F65',
        },
        accent: {
          green: '#16A34A',
          red: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Montserrat', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marquee': 'marquee 25s linear infinite',
        'spotlight': 'spotlight 2s ease .75s 1 forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(245, 184, 46, 0.4)' },
          '100%': { boxShadow: '0 0 35px rgba(245, 184, 46, 0.9)' },
        }
      }
    },
  },
  plugins: [],
}
