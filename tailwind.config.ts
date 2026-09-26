import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7A0451',
          hover: '#5B033C',
          light: '#FDF2F8',
          soft: '#FDF2F8',
          accent: '#B85D88',
          dark: '#1A1118',
        },
        gold: {
          DEFAULT: '#D97706',
          light: '#FEF3C7',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8F6F7',
          elevated: '#FFFFFF',
        },
        background: {
          DEFAULT: '#FAF9F6',
          alt: '#F4F1ED',
        },
        text: {
          main: '#191216',
          body: '#2D252A',
          muted: '#6B6267',
        },
        border: {
          DEFAULT: '#EBE6E8',
          subtle: '#F0EBED',
        },
      },
      fontFamily: {
        sans: ['Inter', 'var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Poppins', 'var(--font-poppins)', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Poppins', 'var(--font-poppins)', 'system-ui', '-apple-system', 'sans-serif'],
        poppins: ['Poppins', 'var(--font-poppins)', 'system-ui', '-apple-system', 'sans-serif'],
        inter: ['Inter', 'var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'card': '14px',
        'pill': '9999px',
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(122, 4, 81, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 12px 28px -6px rgba(122, 4, 81, 0.09), 0 4px 10px -2px rgba(0, 0, 0, 0.03)',
        'elevated': '0 20px 40px -10px rgba(25, 18, 22, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
