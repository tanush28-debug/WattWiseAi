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
          card: '#FFFFFF',
          dark: '#151713',
          darkCard: '#1D201A',
          darkBorder: '#1E293B',
          lightBorder: '#E2E8F0'
        }
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
        DEFAULT: '4px',
        md: '4px',
        lg: '6px',
        xl: '6px',
        '2xl': '6px',
        '3xl': '6px',
        full: '4px'
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'subtle': 'none',
        'card': '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'card-hover': '0 2px 4px 0 rgba(15, 23, 42, 0.06)',
        'cobalt-glow': 'none',
        'cobalt-sm': 'none'
      }
    },
  },
  plugins: [],
}
