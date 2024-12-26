import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginSass } from '@rsbuild/plugin-sass'
import CompressionPlugin from 'compression-webpack-plugin'
import { pluginReleaseTag } from "./scripts/release-tag"

export default defineConfig({
  plugins: [pluginReact(),pluginSass(), pluginReleaseTag({})],
  source: {
    alias: {
      '@': './src'
    }
  },
  html:{
    template: './public/index.html'
  },
  server:{
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://us.mgjkn.com/',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      },
      '/ws': {
        target: 'ws://us.ws.mgjkn.com',
        ws: true,
        pathRewrite: {
          '^/ws': ''
        }
      }
    }
  },
  tools: {
    rspack: {
      plugins: [new CompressionPlugin({})]
    },
    swc: {
      jsc: {
        experimental: {
          plugins: [['@swc/plugin-styled-jsx', {}]]
        }
      }
    }
  }
})
