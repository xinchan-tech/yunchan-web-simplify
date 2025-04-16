import { useAuthorized } from '@/hooks'
import { router } from '@/router'
import { cn } from '@/utils/style'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { JknIcon } from '../jkn/jkn-icon'

type MenuItem = {
  icon: IconName | ReactNode
  title: string
  path: string
}

const Menu = () => {
  const [pathname, setPathname] = useState(router.state.location.pathname)

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
        title: '首页',
        path: '/app'
      },
      {
        icon: <JknIcon.Svg name="views" size={24} />,
        title: '行情',
        path: '/app/views'
      },
      {
        icon: <JknIcon.Svg name="pool" size={24} />,
        title: '自选',
        path: '/app/golden'
      },
      {
        icon: <JknIcon.Svg name="picker" size={24} />,
        title: '选股',
        path: '/app/super'
      },
      // {
      //   icon: <JknIcon.Svg name="ai-alarm" size={24} />,
      //   title: 'AI警报',
      //   path: '/alarm'
      // },
      {
        icon: <JknIcon.Svg name="calendar" size={24} />,
        title: '日历',
        path: '/app/calendar'
      },
      {
        icon: <JknIcon.Svg name="chat-message" size={24} />,
        title: '消息',
        path: '/app/message'
      }
      // {
      //   icon: <JknIcon.Svg name="shout" size={24} />,
      //   title: '大V快评',
      //   path: '/shout'
      // },
      // {
      //   icon: <Settings className="text-[#3c3c3c]" />,
      //   title: '设置',
      //   path: '/setting'
      // }
    ],
    []
  )

  const [auth, toastNotAuth] = useAuthorized('vcomment')

  const onNav = (path: string) => {
    if (path === '/app/shout' && !auth()) {
      toastNotAuth()
      return
    }

    return router.navigate(path)
  }

  return (
    <div className="h-full flex flex-col items-center w-full px-0.5 box-border space-y-2.5 text-foreground">
      {menus.map(item => (
        <div className="text-center cursor-pointer hover:text-primary" key={item.title}>
          <div
            onClick={() => onNav(item.path)}
            onKeyDown={() => {}}
            className={cn(
              'flex flex-col items-center hover:bg-accent w-8 h-[28px] justify-center rounded-xs',
              pathname === item.path && 'bg-primary/30'
            )}
          >
            <div className={cn('flex', pathname === item.path ? 'text-primary' : '')}>{item.icon}</div>
          </div>
          <span className={cn('text-xs', pathname === item.path ? 'text-primary' : '')}>{item.title}</span>
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

export default Menu
