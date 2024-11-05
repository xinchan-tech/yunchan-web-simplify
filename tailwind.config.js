/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      textColor: {
        primary: 'var(--text-color)',
        secondary: 'var(--text-secondary-color)',
        tertiary: 'var(--text-tertiary-color)'
      },
      colors: {
        'stock-up': 'var(--stock-up-color)',
        'stock-down': 'var(--stock-down-color)',
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      backgroundColor: {
        primary: 'var(--bg-color)',
        secondary: 'var(--bg-secondary-color)',
        active: 'var(--bg-active-color)',
        hover: 'var(--bg-hover-color)'
      },
      borderColor: {
        primary: 'var(--border-color)',
        secondary: 'var(--border-secondary-color)'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
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
