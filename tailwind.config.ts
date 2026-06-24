import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
  ],
  safelist: [
    'text-green-700', 'text-amber-700', 'text-red-700', 'text-blue-700',
    'bg-green-100', 'bg-amber-100', 'bg-red-100', 'bg-blue-100',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C9922A',
          light: '#E8B96A',
          dark: '#8C6318',
          muted: 'rgba(201,146,42,0.08)',
        },
        brown: {
          DEFAULT: '#3D1F0D',
          light: '#6B3A1F',
          dark: '#1C0D06',
        },
        cream: {
          DEFAULT: '#FAF4E8',
          dark: '#F0E4CC',
        },
        charcoal: '#1C1410',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        brand: '2px',
        'brand-md': '4px',
      },
      boxShadow: {
        'gold-sm': '0 1px 3px rgba(201,146,42,0.20)',
        'gold-md': '0 4px 12px rgba(201,146,42,0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
