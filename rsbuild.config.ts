import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginSass } from '@rsbuild/plugin-sass';

export default defineConfig({
  plugins: [pluginReact(),pluginSass()],
  source: {
    alias: {
      '@': './src'
    }
  },
  html:{
    template: './public/index.html'
  },
  server:{
    proxy: {
      '/api': {
        target: 'http://us.mgjkn.com/',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  },
  tools: {
    swc: {
      jsc: {
        experimental: {
          plugins: [['@swc/plugin-styled-jsx', {}]]
        }
      }
    }
  }
})
