import App from '@/app'
import { lazy } from 'react'
import { Navigate, type RouteObject } from 'react-router'

export const routes: RouteObject[] = [
  {
    path: '/',
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
  },
  {
    path: '/app',
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
        path: '/app/stock',
        Component: lazy(() => import('@/pages/stock')),
        children: [
          {
            index: true,
            Component: lazy(() => import('@/pages/stock/info')),
            handle: {
              title: '个股盘口'
            }
          },
          {
            path: '/app/stock/alarm',
            Component: lazy(() => import('@/pages/stock-alarm')),
            handle: {
              title: '股票警报'
            }
          },
          {
            path: '/app/stock/*',
            Component: lazy(() => import('@/pages/stock/info')),
            handle: {
              title: '个股盘口'
            }
          }
        ]
      },
      {
        path: '/app/golden',
        Component: lazy(() => import('@/pages/golden-pool')),
        handle: {
          title: '股票自选'
        }
      },
      {
        path: '/app/views',
        Component: lazy(() => import('@/pages/views')),
        handle: {
          title: '行情概览'
        }
      },
      {
        path: '/app/super',
        Component: lazy(() => import('@/pages/super')),
        handle: {
          title: '超级选股'
        }
      },
      {
        path: '/app/calendar',
        Component: lazy(() => import('@/pages/calendar')),
        handle: {
          title: '股票日历'
        }
      },
      {
        path: '/app/message',
        Component: lazy(() => import('@/pages/message')),
        handle: {
          title: '消息中心'
        }
      },
      {
        path: '/app/shout',
        Component: lazy(() => import('@/pages/shout')),
        handle: {
          title: '大V快评'
        }
      },
      {
        path: '/app/setting',
        Component: lazy(() => import('@/pages/setting')),
        handle: {
          title: '系统设置'
        }
      },

      {
        path: '/app/push',
        Component: lazy(() => import('@/pages/push')),
        handle: {
          title: '特色推送'
        }
      },

      {
        path: '/app/mall',
        Component: lazy(() => import('@/pages/mall')),
        handle: {
          title: '特色商城'
        }
      },

      {
        path: '/app/finance',
        Component: lazy(() => import('@/pages/finance')),
        handle: {
          title: '财务估值'
        }
      },

      {
        path: '/app/login',
        Component: lazy(() => import('@/pages/login')),
        handle: {
          title: '登录'
        }
      },

      {
        path: '/app/user',
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
      }
    ]
  },
  {
    path: '/chat',
    Component: lazy(() => import('@/pages/groupchat')),
    handle: {
      title: '讨论社群'
    }
  },
  {
    path: '/community',
    Component: lazy(() => import('@/pages/community')),
    handle: {
      title: '讨论社群'
    }
  },
  {
    path: '*',
    element: <Navigate to="/app" />,
    handle: {
      title: ''
    }
  }
]
