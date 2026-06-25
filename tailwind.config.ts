import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50:  '#e6f7f7',
          100: '#b3e8e8',
          200: '#80d9d9',
          300: '#4dcaca',
          400: '#26bcbc',
          500: '#009E9E',  // primary brand teal
          600: '#008080',
          700: '#006B6B',  // dark teal
          800: '#004F4F',
          900: '#002B35',  // very dark teal (sidebar/bg)
          950: '#001820',
        },
        brand: {
          primary:   '#009E9E',
          secondary: '#006B6B',
          dark:      '#002B35',
          gray:      '#A0A0A0',
          light:     '#DCDCDC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #009E9E 0%, #006B6B 50%, #002B35 100%)',
        'gradient-card':  'linear-gradient(135deg, #001820 0%, #002B35 100%)',
      },
      animation: {
        'scan-pulse': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
}

export default config
