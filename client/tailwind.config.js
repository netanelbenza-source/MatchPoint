/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#163a73',
          deep: '#0d274f',
          soft: '#e7eef8',
        },
        coral: {
          DEFAULT: '#ff5d78',
          deep: '#e44562',
        },
        mist: '#f4f6fb',
      },
      fontFamily: {
        sans: ['Heebo', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 24px 60px rgba(22, 58, 115, 0.12)',
      },
      borderRadius: {
        card: '1.5rem',
      },
    },
  },
}
