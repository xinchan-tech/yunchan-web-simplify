import { lazy } from "react"
import type { RouteObject } from "react-router-dom"

export const routes: RouteObject[] = [
  {
    index: true,
    path: "/",
    Component: lazy(() => import('@/pages/dashboard')),
  },
  
]

