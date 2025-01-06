import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginSass } from '@rsbuild/plugin-sass'
import CompressionPlugin from 'compression-webpack-plugin'
import { pluginReleaseTag } from './scripts/release-tag'
import { pluginTypedCSSModules } from '@rsbuild/plugin-typed-css-modules'

export default defineConfig({
  plugins: [pluginReact(), pluginSass(), pluginReleaseTag({}), pluginTypedCSSModules()],
  source: {
    alias: {
      '@': './src'
    }
  },
  html: {
    template: './public/index.html'
  },
  server: {
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
      },
      '/websocket': {
        target: 'ws://web.mgjkn.com',
        ws: true
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
