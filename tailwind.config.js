/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f5f0e8',
        text: {
          DEFAULT: '#3d3528',
          light: '#6b6355',
        },
        primary: {
          DEFAULT: '#7a8d7a',
          light: '#9aad9a',
          dark: '#5a6d5a',
        },
        secondary: {
          DEFAULT: '#f0e8d8',
          light: '#f8f4ed',
        },
        accent: {
          DEFAULT: '#d4c4d4',
        },
      },
      fontFamily: {
        serif: ['var(--font-lora)', 'Lora', 'serif'],
      },
      borderRadius: {
        DEFAULT: '1rem',
      },
      transitionDuration: {
        '500': '500ms',
        '700': '700ms',
      },
    },
  },
  plugins: [],
}
