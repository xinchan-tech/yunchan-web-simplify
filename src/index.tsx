import { scan } from 'react-scan'
import ReactDOM from 'react-dom/client'
import '@/plugins/dayjs-plugin'
import '@/utils/i18n'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { StrictMode, Suspense } from "react"
import '@/plugins/decimal-plugin'
import { } from '@/utils/stock'
import { initDataSource } from './pages/groupchat/Service/dataSource.ts'
import { RouterProvider } from 'react-router'
import { router } from "./router"
import './app.scss'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 6,
    },
  },
});

if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
  scan({
    enabled: true,
    // log: true, // logs render info to console (default: false)
  })
}
initDataSource()

const rootEl = document.getElementById("root");
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div />}>
          <RouterProvider router={router} />
        </Suspense>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </StrictMode>
  );
}
