import { defineConfig, presetUno } from 'unocss';

export default defineConfig({
  content: {
    filesystem: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  },
  theme: {
    colors: {

    },
    backgroundColor: {
      primary: 'var(--bg-color)',
      secondary: 'var(--bg-secondary-color)',
      active: 'var(--bg-active-color)',
      hover: 'var(--bg-hover-color)',
    },
    borderColor: {
      primary: 'var(--border-color)',
    }
  },
  shortcuts: {
    'border-style-primary': 'border border-solid border-primary',
  },
  presets: [presetUno()],
})