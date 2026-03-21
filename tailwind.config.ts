import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1B5E20',
          dark:    '#14491A',
          light:   '#2E7D32',
          accent:  '#43A047',
          bg:      '#D4C9B0',
        },
      },
    },
  },
  plugins: [],
}

export default config
