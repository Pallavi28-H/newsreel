/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink:      '#1a1208',
        paper:    '#f5f0e8',
        amber:    '#d97706',
        rust:     '#b45309',
        cream:    '#fef9ee',
        charcoal: '#292115',
        muted:    '#9c8e79',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
