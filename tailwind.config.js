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
      colors: {},
      backgroundColor: {
        primary: 'var(--bg-color)',
        secondary: 'var(--bg-secondary-color)',
        active: 'var(--bg-active-color)',
        hover: 'var(--bg-hover-color)'
      },
      borderColor: {
        primary: 'var(--border-color)'
      }
    }
  },
  plugins: [],
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
