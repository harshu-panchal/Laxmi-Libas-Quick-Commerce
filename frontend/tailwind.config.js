/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Safelist grid column classes for dynamic sections
    'grid-cols-2',
    'grid-cols-3',
    'grid-cols-4',
    'grid-cols-6',
    'grid-cols-8',
    'md:grid-cols-2',
    'md:grid-cols-3',
    'md:grid-cols-4',
    'md:grid-cols-6',
    'md:grid-cols-8',
    'lg:grid-cols-2',
    'lg:grid-cols-3',
    'lg:grid-cols-4',
    'lg:grid-cols-6',
    'lg:grid-cols-8',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#FFD54F',
          DEFAULT: '#FFC107',
          dark: '#F57C00',
        },
        hotel: {
          light: '#60A5FA',
          DEFAULT: '#2563EB',
          dark: '#1E40AF',
        },
        partner: {
          bg: '#FFFFFF',
          text: {
            primary: '#111827',
            secondary: '#4B5563',
          },
          btn: '#111827',
        },
        cream: '#FFF9C4',
      },
    },
  },
  plugins: [],
}

