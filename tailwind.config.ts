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
          DEFAULT: '#C67D10',
          light: '#EEA02B',
          dark: '#975F0C',
          muted: 'rgba(198,125,16,0.08)',
        },
        crimson: {
          DEFAULT: '#93331F',
          light: '#BD4128',
          dark: '#692416',
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
        ethiopic: ['var(--font-ethiopic)', 'serif'],
      },
      borderRadius: {
        brand: '2px',
        'brand-md': '4px',
      },
      boxShadow: {
        'gold-sm': '0 1px 3px rgba(198,125,16,0.20)',
        'gold-md': '0 4px 12px rgba(198,125,16,0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
