import ReactDOM from 'react-dom/client'
import App from './app.tsx'
import { ConfigProvider } from 'antd'
import DarkTheme from '@/theme/dark'
import '@/utils/i18n'
import zhCN from 'antd/locale/zh_CN'
import {useConfig} from '@/store'
import dayjs from "dayjs"
import utc from 'dayjs/plugin/utc'
import tz from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(tz)

const rootEl = document.getElementById('root')
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl)
  root.render(

      <ConfigProvider locale={useConfig.getState().language === 'zh_CN' ? zhCN : undefined} theme={ DarkTheme }>
        <App />
      </ConfigProvider>
  )
}
