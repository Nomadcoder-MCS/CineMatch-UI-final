/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-orange': '#F56600',
        'brand-purple': '#522D80',
        'brand-bg': '#EDEDED',
        'brand-surface': '#FFFFFF',
        'brand-text-primary': '#111111',
        'brand-text-body': '#444444',
        'brand-text-secondary': '#777777',
        'brand-border': '#DDDDDD',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
}

