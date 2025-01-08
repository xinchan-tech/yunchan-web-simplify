import { scan } from 'react-scan'
import ReactDOM from 'react-dom/client'
import '@/plugins/dayjs-plugin'
import '@/utils/i18n'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { StrictMode } from "react"
import '@/plugins/decimal-plugin'
import { } from '@/utils/stock'
import App from './app.tsx'



const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 6
    }
  }
})

// if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
//   scan({
//     enabled: true,
//     // log: true, // logs render info to console (default: false)
//   })
// }


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
