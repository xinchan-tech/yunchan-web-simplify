/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    fontFamily: {
      pingfang: ['PingFang SC', 'sans-serif']
    },
    extend: {
      textColor: {
        secondary: 'hsl(var(--text-secondary))',
        tertiary: 'hsl(var(--text-tertiary))'
      },
      colors: {
        stock: {
          up: 'hsl(var(--stock-up-color))',
          down: 'hsl(var(--stock-down-color))',
          green: 'hsl(var(--color-stock-green))',
          red: 'hsl(var(--color-stock-red))'
        },
        active: 'hsl(var(--active-color))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        table: {
          header: 'hsl(var(--table-header))'
        },
        dialog: {
          border: 'hsl(var(--dialog-border))'
        },
        chat: {
          background: 'var(--chat-background)'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xs: 'calc(var(--radius) - 6px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require('tailwindcss-animate')],
  corePlugins: {
    preflight: false
  }
}

// export default defineConfig({
//   content: {
//     filesystem: ['./src/**/*.{html,js,ts,jsx,tsx}'],
//   },
//   theme: {

//   },
//   shortcuts: {
//     'border-style-primary': 'border border-solid border-primary',
//   },
//   presets: [presetUno()],
// })
