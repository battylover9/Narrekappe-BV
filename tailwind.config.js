/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'narrek-bg': '#071026',
        'narrek-bg-dark': '#021023',
        'narrek-card': '#0f1724',
        'narrek-muted': '#9aa6b2',
        'narrek-accent': '#3990ff',
        'narrek-accent-2': '#6ee7b7',
        'narrek-danger': '#ff6464',
      },
      backgroundImage: {
        'narrek-gradient': 'linear-gradient(180deg, #071026, #021023)',
      },
    },
  },
  plugins: [],
}
