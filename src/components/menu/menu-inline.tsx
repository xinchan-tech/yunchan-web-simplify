import { useAuthorized, useToast } from '@/hooks'
import { router } from '@/router'
import { useToken } from '@/store'
import { cn } from '@/utils/style'
import { ChevronsLeft, Settings } from 'lucide-react'
import { Fragment, type ReactNode, useEffect, useMemo, useState } from 'react'
import { JknIcon } from '../tc/jkn-icon'

type MenuItem = {
  icon: IconName | ReactNode
  title: string
  path: string
}


const MenuInline = () => {
  const [pathname, setPathname] = useState(router.state.location.pathname)
  const { token } = useToken()
  const { toast } = useToast()

  useEffect(() => {
    const s = router.subscribe(s => {
      setPathname(s.location.pathname)
    })

    return () => {
      s()
    }
  }, [])

  const menus: MenuItem[] = useMemo(
    () => [
      {
        icon: <JknIcon.Svg name="wallet-icon" size={24} />,
        title: '我的钱包',
        path: '/assets'
      },
      {
        icon: <JknIcon.Svg name="aiTrading-icon" size={24} />,
        title: 'AI交易',
        path: '/assets/aiTrading'
      },
      {
        icon: <JknIcon.Svg name="invest-icon" size={24} />,
        title: '投资组合',
        path: '/assets/invest'
      },
      {
        icon: <JknIcon.Svg name="historyList-icon" size={24} />,
        title: '历史查询',
        path: '/assets/historyList'
      },

      {
        icon: <JknIcon.Svg name="curvReport-icon" size={24} />,
        title: '回报曲线',
        path: '/assets/curvReport'
      },
    ],
    []
  )

  const [auth, toastNotAuth] = useAuthorized('vcomment')

  const onNav = (path: string) => {
    if (!token && path !== '/' && path !== '/setting') {
      toast({
        title: '请先登录'
      })
      return
    }

    if (path === '/shout' && !auth()) {
      toastNotAuth()
      return
    }

    return router.navigate(path)
  }

  return (
    <div className="h-full flex flex-col items-center w-full px-0.5 box-border space-y-2.5 text-foreground">
      {menus.map(item => (
        <div
          onClick={() => onNav(item.path)}
          className={cn('text-center text-inherit w-full  min-w-[7.8125rem] p-2.5 box-border text-gray-400 cursor-pointer hover:text-white hover:bg-[#2E2E2E] rounded-[18.75rem] flex justify-start items-center',
            pathname === item.path && `bg-[#2E2E2E] active_border ` )} key={item.title}>
          <div
            onKeyDown={() => { }}
            className={cn(
              'flex flex-col items-center  w-8 h-[28px] justify-center rounded-xs',
            )}
          >
            <div className={cn('flex', pathname === item.path ? 'text-white' : '')}>{item.icon}</div>
          </div>
          <span className={cn('text-base ml-2', pathname === item.path ? 'text-white' : '')}>{item.title}</span>
        </div>
      ))}
      {/* <style jsx>
        {`
            {
              .active-icon {
                filter: invert(50%) sepia(96%) saturate(6798%) hue-rotate(227deg) brightness(99%) contrast(94%);
              }

              .active-text {
                color: hsl(var(--primary))
              }
              .active_border {
                background: linear-gradient(45deg, hsl(358, 95%, 77%), hsl(43, 95%, 77%), hsl(59, 98%, 95%), hsl(191, 92%, 79%), hsl(197, 95%, 52%), hsl(244, 84%, 76%), hsl(43, 95%, 77%));
                background-clip: text;
                -webkit-text-fill-color: transparent;
                border: 1px solid;
                border-image: linear-gradient(45deg, hsl(358, 95%, 77%), hsl(43, 95%, 77%), hsl(59, 98%, 95%), hsl(191, 92%, 79%), hsl(197, 95%, 52%), hsl(244, 84%, 76%), hsl(43, 95%, 77%)) 1;
                animation: animate 3s linear infinite;
                -webkit-clip-path: ellipse(18.75rem 18.75rem at 50% 50%);
                -moz-clip-path: ellipse(18.75rem 18.75rem at 50% 50%);
                clip-path: ellipse(18.75rem 18.75rem at 50% 50%);
                
              }

              .active_border::before {
                  background: linear-gradient(45deg, hsl(358, 95%, 77%), hsl(43, 95%, 77%), hsl(59, 98%, 95%), hsl(191, 92%, 79%), hsl(197, 95%, 52%), hsl(244, 84%, 76%), hsl(43, 95%, 77%));
              }

              @keyframes animate {
                0% {
                  filter: hue-rotate(0deg);
                }
                
                100% {
                  filter: hue-rotate(360deg);
                }
              }
            }`}
            </style> */}
    </div>
  )
}

export default MenuInline
