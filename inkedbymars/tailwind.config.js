/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg-rgb) / <alpha-value>)',
        surface: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        red: 'rgb(var(--color-red-rgb) / <alpha-value>)',
        'red-dark': 'rgb(var(--color-red-dark-rgb) / <alpha-value>)',
        ink: 'rgb(var(--color-ink-rgb) / <alpha-value>)',
        leather: 'rgb(var(--color-leather-rgb) / <alpha-value>)',
        cream: 'rgb(var(--color-cream-rgb) / <alpha-value>)',
        ash: 'rgb(var(--color-ash-rgb) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Cormorant Garamond', 'serif'],
        mono: ['Space Mono', 'monospace'],
      },
      boxShadow: {
        red: '0 24px 80px rgba(205, 45, 43, 0.22)',
        leather: '0 24px 80px rgba(26, 16, 8, 0.28)',
      },
    },
  },
  plugins: [],
}
