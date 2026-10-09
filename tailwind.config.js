/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef5ff',
          100: '#dfeafc',
          500: '#2d6cdf',
          700: '#1e4db8',
        },
        success: '#2dbf88',
        warning: '#f28c28',
        danger: '#ef5a5a',
      },
      boxShadow: {
        soft: '0 18px 38px rgba(32, 54, 107, 0.12)',
      },
    },
  },
  plugins: [],
};
