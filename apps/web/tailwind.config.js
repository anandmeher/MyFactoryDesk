/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1f2937',
        },
      },
      minHeight: {
        // Tap-target floor per spec — every interactive row uses min-h-tap.
        tap: '56px',
      },
    },
  },
  plugins: [],
}
