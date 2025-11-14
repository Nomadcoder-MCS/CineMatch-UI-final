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
    },
  },
  plugins: [],
}

