import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Burke Truck & Equipment brand palette
        burke: {
          bg:     '#0C0E12',
          plate:  '#111418',
          panel:  '#161A20',
          raised: '#1C2028',
          line:   '#242A34',
          line2:  '#2E3644',
          ink:    '#DDE3EE',
          ink2:   '#8896AE',
          ink3:   '#4D5C72',
          gold:   '#F0A500',
          gold2:  '#FFC340',
        },
        p1: '#EF4444',
        p2: '#F0A500',
        p3: '#22C55E',
      },
      fontFamily: {
        sans:  ['Barlow', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
        display: ['Bebas Neue', 'cursive'],
      },
      keyframes: {
        cardIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      animation: {
        cardIn: 'cardIn 0.18s ease',
        fadeIn: 'fadeIn 0.15s ease',
      },
    },
  },
  plugins: [],
}

export default config
