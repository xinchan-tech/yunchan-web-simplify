import App from '@/app'
import { lazy } from 'react'
import type { RouteObject } from 'react-router'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        Component: lazy(() => import('@/pages/dashboard')),
        handle: {
          title: '首页'
        }
      },
      {
        path: '/stock',
        Component: lazy(() => import('@/pages/stock')),
        children: [
          {
            index: true,
            element: <div/>,
            handle: {
              title: '个股盘口'
            }
          },
          {
            path: '/stock/alarm',
            Component: lazy(() => import('@/pages/stock-alarm')),
            handle: {
              title: '股票警报'
            }
          },
          {
            path: '/stock/*',
            element: <div/>,
            handle: {
              title: '个股盘口'
            }
          }
        ]
      },
      {
        path: '/golden',
        Component: lazy(() => import('@/pages/golden-pool')),
        handle: {
          title: '股票自选'
        }
      },
      {
        path: '/views',
        Component: lazy(() => import('@/pages/views')),
        handle: {
          title: '行情概览'
        }
      },
      {
        path: '/super',
        Component: lazy(() => import('@/pages/super')),
        handle: {
          title: '超级选股'
        }
      },
      {
        path: '/calendar',
        Component: lazy(() => import('@/pages/calendar')),
        handle: {
          title: '股票日历'
        }
      },
      {
        path: '/message',
        Component: lazy(() => import('@/pages/message')),
        handle: {
          title: '消息中心'
        }
      },
      {
        path: '/shout',
        Component: lazy(() => import('@/pages/shout')),
        handle: {
          title: '大V快评'
        }
      },
      // {
      //   path: '/alarm',
      //   Component: lazy(() => import('@/pages/alarm')),
      //   handle: {
      //     title: 'AI警报'
      //   }
      // },
      {
        path: '/setting',
        Component: lazy(() => import('@/pages/setting')),
        handle: {
          title: '系统设置'
        }
      },

      {
        path: '/push',
        Component: lazy(() => import('@/pages/push')),
        handle: {
          title: '特色推送'
        }
      },

      {
        path: '/mall',
        Component: lazy(() => import('@/pages/mall')),
        handle: {
          title: '特色商城'
        }
      },

      {
        path: '/finance',
        Component: lazy(() => import('@/pages/finance')),
        handle: {
          title: '财务估值'
        }
      },

      {
        path: '/login',
        Component: lazy(() => import('@/pages/login')),
        handle: {
          title: '登录'
        }
      },

      {
        path: '/user',
        Component: lazy(() => import('@/pages/user')),
        children: [
          {
            index: true,
            Component: lazy(() => import('@/pages/user/user-center')),
            handle: {
              title: ''
            }
          },
          {
            path: 'bills',
            Component: lazy(() => import('@/pages/user/bills')),
            handle: {
              title: '账单管理'
            }
          },
          {
            path: 'invite',
            Component: lazy(() => import('@/pages/user/invite')),
            handle: {
              title: '邀请好友'
            }
          },
          // {
          //   path: 'invite',
          //   Component: lazy(() => import('@/pages/user/invite')),
          //   handle: {
          //     title: '邀请规则'
          //   }
          // },
          {
            path: 'subscribe',
            Component: lazy(() => import('@/pages/user/subscribe')),
            handle: {
              title: '订阅管理'
            }
          }
        ],
        handle: {
          title: '个人中心'
        }
      },
    ]
  },
  {
    path: '/chat',
    element: <div/>,
    handle: {
      title: '讨论社群'
    }
  },

  {
    path: '/assets',
    element: <div/>,
    Component: lazy(() => import('@/pages/assets/wallet')),
    children: []
  },
  {
    path: '/home',
    Component: lazy(() => import('@/pages/home')),
    children: [
      {
        index: true,
        Component: lazy(() => import('@/pages/home/home'))
      },
      {
        path: 'features',
        Component: lazy(() => import('@/pages/home/features'))
      },
      {
        path: 'cookies',
        Component: lazy(() => import('@/pages/home/cookies'))
      }
    ],
    handle: {
      title: '官网'
    }
  }
]
