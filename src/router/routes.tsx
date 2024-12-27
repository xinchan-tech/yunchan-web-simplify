import { lazy } from "react"
import type { RouteObject } from "react-router"

export const routes: RouteObject[] = [
  {
    index: true,
    path: "/",
    Component: lazy(() => import('@/pages/dashboard')),
    handle:{
      title: '首页'
    }
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
  },
  {
    path: '/message',
    Component: lazy(() => import('@/pages/message')),
    handle:{
      title: '消息中心'
    }
  },
  {
    path: '/shout',
    Component: lazy(() => import('@/pages/shout')),
    handle:{
      title: '大V快评'
    }
  },
  {
    path: '/alarm',
    Component: lazy(() => import('@/pages/alarm')),
    handle:{
      title: 'AI报警'
    }
  },
  {
    path: '/setting',
    Component: lazy(() => import('@/pages/setting')),
    handle:{
      title: '系统设置'
    }
  },
  {
    path: '/stock/:type',
    Component: lazy(() => import('@/pages/stock')),
    handle:{
      title: '个股盘口'
    }
  }
  
]

