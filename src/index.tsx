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
import { StrictMode } from "react"
import '@/plugins/decimal-plugin'
import { wsManager } from "./utils/ws/manager.ts"


dayjs.extend(utc)
dayjs.extend(tz)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.tz.setDefault('America/New_York')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 6
    }
  }
})

// const localStoragePersister = createSyncStoragePersister({
//   storage: window.localStorage,
//   retry: removeOldestQuery,

// })

wsManager.create(import.meta.env.PUBLIC_BASE_WS_URL)



// persistQueryClient({
//   queryClient,
//   persister: localStoragePersister
// })

const rootEl = document.getElementById('root')
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </StrictMode>
  )
}
