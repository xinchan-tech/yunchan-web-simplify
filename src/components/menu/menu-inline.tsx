import { useAuthorized, useToast } from '@/hooks'
import { router } from '@/router'
import { useToken } from '@/store'
import { cn } from '@/utils/style'
import { ChevronsLeft, Settings } from 'lucide-react'
import { Fragment, type ReactNode, useEffect, useMemo, useState } from 'react'
import { JknIcon } from '../jkn/jkn-icon'

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
        icon: <JknIcon.Svg name="dashboard" size={24} />,
        title: '我的钱包',
        path: '/assets'
      },
      {
        icon: <JknIcon.Svg name="views" size={24} />,
        title: 'AI交易',
        path: '/views'
      },
      {
        icon: <JknIcon.Svg name="pool" size={24} />,
        title: '投资组合',
        path: '/golden'
      },
      {
        icon: <JknIcon.Svg name="picker" size={24} />,
        title: '历史查询',
        path: '/super'
      },

      {
        icon: <JknIcon.Svg name="calendar" size={24} />,
        title: '回报曲线',
        path: '/calendar'
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
        <div className={cn('text-center text-inherit w-full  min-w-[7.8125rem] p-2.5 box-border text-gray-400 cursor-pointer hover:text-white hover:bg-[#2E2E2E] rounded-md flex justify-start items-center', pathname === item.path && 'bg-[#2E2E2E]')} key={item.title}>
          <div
            onClick={() => onNav(item.path)}
            onKeyDown={() => { }}
            className={cn(
              'flex flex-col items-center  w-8 h-[28px] justify-center rounded-xs'
            )}
          >
            <div className={cn('flex', pathname === item.path ? 'text-white' : '')}>{item.icon}</div>
          </div>
          <span className={cn('text-base ml-2', pathname === item.path ? 'text-white' : '')}>{item.title}</span>
        </div>
      ))}
      <style jsx>{`
            {
              .active-icon {
                filter: invert(50%) sepia(96%) saturate(6798%) hue-rotate(227deg) brightness(99%) contrast(94%);
              }

              .active-text {
                color: hsl(var(--primary))
              }
            }`}</style>
    </div>
  )
}

export default MenuInline
