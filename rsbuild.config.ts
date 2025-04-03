import path from 'node:path'
import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginSass } from '@rsbuild/plugin-sass'
import { pluginTypedCSSModules } from '@rsbuild/plugin-typed-css-modules'
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin'
import CompressionPlugin from 'compression-webpack-plugin'
import { pluginReleaseTag } from './scripts/release-tag'
import { pluginSvgSpriteIcons } from './scripts/rsbuild-plugin-svg-sprite-icons'

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginSass(),
    pluginReleaseTag({ outFile: true }),
    pluginTypedCSSModules(),
    pluginSvgSpriteIcons({
      path: path.resolve(__dirname, 'src/assets/svg'),
      symbolId: 'icon-[name]'
    })
  ],
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
      '/apiv2': {
        target: 'https://awstest.mgjkn.com/',
        changeOrigin: true,
        pathRewrite: {
          '^/apiv2': ''
        }
      },
      '/api': {
        target: 'http://api.awstest.mgjkn.com',
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
      '/v2-ws': {
        target: 'ws://api.awstest.mgjkn.com/ws',
        ws: true,
        pathRewrite: {
          '^/v2-ws': ''
        }
      },
      '/websocket': {
        target: 'ws://chart.mgjkn.com',
        ws: true
      },
      '/im-ws': {
        // target: "ws://im.mgjkn.com:5200",
        target: 'ws://test.im.mgjkn.com:5200',
        ws: true,
        pathRewrite: { '^/im-ws': '' }
      }
    }
  },
  tools: {
    rspack(_, { appendPlugins, addRules }) {
      if (process.env.NODE_ENV === 'production') {
        appendPlugins(
          new RsdoctorRspackPlugin({
            supports: {
              generateTileGraph: true
            }
          })
        )
      }

      appendPlugins(new CompressionPlugin({}))
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
