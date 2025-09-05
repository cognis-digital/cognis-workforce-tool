/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary purple theme from the image
        primary: {
          50: '#faf7ff',
          100: '#f1ebff',
          200: '#e6dcff',
          300: '#d1c2ff',
          400: '#b599ff',
          500: '#9966ff',
          600: '#581CA0', // Primary accent from image
          700: '#371C9C', // Secondary accent from image
          800: '#2d1570',
          900: '#1f0e4a',
          950: '#0D0A2C'  // Card background from image
        },
        // Text colors from the theme
        text: {
          heading: '#F2F0F4', // Heading color from image
          body: '#DCD7E5',    // Body color from image
          muted: '#B8B3C7',
          subtle: '#9B96A8'
        },
        // Background colors
        background: {
          primary: '#0D0A2C',   // Card background
          secondary: '#1a1429', // Slightly lighter
          tertiary: '#251d3a',  // Even lighter
          glass: 'rgba(13, 10, 44, 0.7)' // Glass effect
        },
        // Status colors with purple theme
        success: {
          500: '#10b981',
          600: '#059669',
          400: '#34d399'
        },
        warning: {
          500: '#f59e0b',
          600: '#d97706',
          400: '#fbbf24'
        },
        error: {
          500: '#ef4444',
          600: '#dc2626',
          400: '#f87171'
        },
        info: {
          500: '#3b82f6',
          600: '#2563eb',
          400: '#60a5fa'
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #581CA0 0%, #371C9C 50%, #0D0A2C 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(88, 28, 160, 0.1) 0%, rgba(55, 28, 156, 0.05) 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)'
      },
      backdropBlur: {
        'xl': '24px',
        '2xl': '40px'
      }
    },
  },
  plugins: [],
};