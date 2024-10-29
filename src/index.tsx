import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app.tsx'
import { ConfigProvider } from 'antd'
import DarkTheme from '@/theme/dark'
import '@/utils/i18n'
import zhCN from 'antd/locale/zh_CN'
import {useConfig} from '@/store'

const rootEl = document.getElementById('root')
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl)
  root.render(
    <React.StrictMode>
      <ConfigProvider locale={useConfig.getState().language === 'zh_CN' ? zhCN : undefined} theme={ DarkTheme }>
        <App />
      </ConfigProvider>
    </React.StrictMode>,
  )
}
