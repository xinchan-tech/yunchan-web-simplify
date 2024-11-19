import ReactDOM from 'react-dom/client'
import App from './app.tsx'
import '@/utils/i18n'
import dayjs from "dayjs"
import utc from 'dayjs/plugin/utc'
import tz from 'dayjs/plugin/timezone'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

dayjs.extend(utc)
dayjs.extend(tz)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.tz.setDefault('America/New_York')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24
    }
  }
})

const rootEl = document.getElementById('root')
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl)
  root.render(
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={true} />
    </QueryClientProvider>
  )
}
