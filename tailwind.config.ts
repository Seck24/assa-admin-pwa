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
          DEFAULT: '#1B3A8A',
          dark:    '#122870',
          light:   '#2550B8',
          accent:  '#3A6FF0',
          bg:      '#0D1F4F',
        },
      },
    },
  },
  plugins: [],
}

export default config
