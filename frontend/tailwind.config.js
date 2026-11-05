/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FAF8F3',
          100: '#F4F0E6', // Official Soft Ivory
          200: '#E7E1D2',
          300: '#D9D0BC',
          400: '#C7BBA2',
          500: '#B0A286',
        },
        midnight: {
          950: '#0C0E0B',
          900: '#151713', // Official Midnight Black
          850: '#1D201A',
          800: '#262A22',
          700: '#353B30',
          600: '#4D5445',
          500: '#69725F',
        },
        cobalt: {
          50: '#EEF3FF',
          100: '#DBE6FE',
          200: '#BED0FE',
          300: '#91B0FD',
          400: '#5E89FA',
          500: '#2457F5', // Official Electric Cobalt Blue
          600: '#173FE6',
          700: '#122ECC',
          800: '#1127A5',
          900: '#142583',
          950: '#0E174E',
        },
        surface: {
          light: '#FFFFFF',
          ivory: '#F4F0E6',
          card: '#FAF8F3',
          dark: '#151713',
          darkCard: '#1D201A',
          darkBorder: '#292E25',
          lightBorder: '#E5DFCFC7'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(21, 23, 19, 0.05), 0 1px 2px 0 rgba(21, 23, 19, 0.03)',
        'card': '0 4px 6px -1px rgba(21, 23, 19, 0.06), 0 2px 4px -1px rgba(21, 23, 19, 0.03)',
        'card-hover': '0 10px 15px -3px rgba(21, 23, 19, 0.08), 0 4px 6px -2px rgba(21, 23, 19, 0.04)',
        'cobalt-glow': '0 0 25px -4px rgba(36, 87, 245, 0.45)',
        'cobalt-sm': '0 0 12px -2px rgba(36, 87, 245, 0.4)'
      }
    },
  },
  plugins: [],
}
