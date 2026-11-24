import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Blueprint primary accent
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        espresso: {
          DEFAULT: '#14110F',
          dark: '#0D0B0A',
          light: '#241E1A',
        },
        charcoal: {
          DEFAULT: '#1A1816',
          surface: '#22201D',
          border: '#332E2A',
        },
        coffee: {
          50: '#FAF7F2',
          100: '#F4EFEA',
          200: '#E5DBD1',
          300: '#D0BEAE',
          400: '#A78B71',
          500: '#846345',
          600: '#6E5035',
          700: '#583F2A',
          800: '#3F2C1D',
          900: '#261A11',
          950: '#18100A',
        },
        cream: {
          DEFAULT: '#FDFBF7',
          surface: '#F7F3EC',
          border: '#ECE4D8',
        },
        amberGold: {
          400: '#F59E0B',
          500: '#D97706',
          600: '#B45309',
        },
        nordic: {
          forest: '#123D2E',
          deep: '#09291F',
          secondary: '#1C5A40',
          gold: '#E6AD38',
          champagne: '#D6B36A',
          ivory: '#F7F1E5',
          cream: '#EFE5D2',
          white: '#FFFFFF',
          coffee: '#563B2D',
          mutedGreen: '#78917C',
          textSecondary: '#887966',
          border: '#E3D8C5',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
