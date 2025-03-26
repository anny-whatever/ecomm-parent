/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4da6ff',
          DEFAULT: '#0078ff',
          dark: '#0056b3'
        },
        secondary: {
          light: '#f8f9fa',
          DEFAULT: '#e9ecef',
          dark: '#dee2e6'
        },
        accent: {
          light: '#ff8a50',
          DEFAULT: '#ff5722',
          dark: '#e64a19'
        }
      },
      fontFamily: {
        sans: ['Inter var', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 5px 0 rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 20px 0 rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}