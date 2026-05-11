/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        condensed: ['"Barlow Condensed"', 'sans-serif'],
        sans: ['Barlow', 'sans-serif'],
      },
      colors: {
        bg:      '#0d0f14',
        bg2:     '#13161e',
        bg3:     '#1a1e2a',
        accent:  '#f0b429',
        danger:  '#e74c3c',
        m1:      '#2e86de',
        m2:      '#8e44ad',
        m3:      '#c0392b',
        gs:      '#27ae60',
      },
    },
  },
  plugins: [],
}
