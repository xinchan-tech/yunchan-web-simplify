import { lazy } from "react"
import type { RouteObject } from "react-router-dom"

export const routes: RouteObject[] = [
  {
    index: true,
    path: "/",
    Component: lazy(() => import('@/pages/dashboard')),
  },
  {
    path: "/golden",
    Component: lazy(() => import('@/pages/golden-pool')),
    handle:{
      title: '股票金池'
    }
  },
  {
    path: "/views",
    Component: lazy(() => import('@/pages/views')),
    handle:{
      title: '行情概览'
    }
  },
  {
    path: '/super',
    Component: lazy(() => import('@/pages/super')),
    handle:{
      title: '超级选股'
    }
  },
  {
    path: '/calendar',
    Component: lazy(() => import('@/pages/calendar')),
    handle:{
      title: '股票日历'
    }
  }
  
]

