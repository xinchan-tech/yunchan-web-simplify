import { useAuthorized, useToast } from '@/hooks'
import { router } from '@/router'
import { useToken } from '@/store'
import { cn } from '@/utils/style'
import { Settings } from 'lucide-react'
import { Fragment, type ReactNode, useEffect, useMemo, useState } from 'react'
import { JknIcon } from '../jkn/jkn-icon'

type MenuItem = {
  icon: IconName | ReactNode
  title: string
  path: string
}

const Menu = () => {
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
        icon: <JknIcon.Svg name="dashboard" size={20} />,
        title: '首页',
        path: '/'
      },
      {
        icon: <JknIcon.Svg name="views" size={20} />,
        title: '行情',
        path: '/views'
      },
      {
        icon: <JknIcon.Svg name="pool" size={20} />,
        title: '自选',
        path: '/golden'
      },
      {
        icon: <JknIcon.Svg name="picker" size={20} />,
        title: '选股',
        path: '/super'
      },
      // {
      //   icon: <JknIcon.Svg name="ai-alarm" size={20} />,
      //   title: 'AI报警',
      //   path: '/alarm'
      // },
      {
        icon: <JknIcon.Svg name="calendar" size={20} />,
        title: '日历',
        path: '/calendar'
      },
      {
        icon: <JknIcon.Svg name="message" size={20} />,
        title: '消息',
        path: '/message'
      },
      // {
      //   icon: <JknIcon.Svg name="shout" size={20} />,
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

  // return router.navigate(...args)
  return (
    <div className="h-full flex flex-col items-center w-full px-0.5 box-border space-y-2.5 mt-1">
      {menus.map(item => (
        <div className="text-center" key={item.title}>
          <div

            onClick={() => onNav(item.path)}
            onKeyDown={() => { }}
            className={cn(
              'flex flex-col items-center cursor-pointer hover:bg-accent w-8 h-8 justify-center rounded-xs',
              pathname === item.path && 'bg-primary/30'
            )}
          >
            <div className={cn('inline-block h-[20px]', pathname === item.path ? 'text-primary' : '')}>{item.icon}</div>
          </div>
          <span className="text-sm">
            {item.title}
          </span>
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
