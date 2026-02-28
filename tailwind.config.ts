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
        brand: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        darkbg: '#0f0f23',
        darkcard: 'rgba(255,255,255,0.06)',
      },

      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        'brand-soft': 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
        'auth-bg':
          'radial-gradient(ellipse at top left, #1e1b4b 0%, #0f0f23 50%, #0f172a 100%)',
      },

      boxShadow: {
        glow: '0 0 20px rgba(99,102,241,0.5)',
        glowLg: '0 0 40px rgba(139,92,246,0.6)',
        card: '0 25px 50px rgba(0,0,0,0.5)',
        soft: '0 10px 30px rgba(0,0,0,0.3)',
      },

      backdropBlur: {
        xs: '2px',
      },

      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 20px rgba(99,102,241,0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(139,92,246,0.7)' },
        },
      },

      animation: {
        float: 'float 4s ease-in-out infinite',
        fadeInUp: 'fadeInUp 0.4s ease forwards',
        pulseGlow: 'pulseGlow 3s ease-in-out infinite',
      },

      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.75rem',
      },
    },
  },
  plugins: [],
}

export default config