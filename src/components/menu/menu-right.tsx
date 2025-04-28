import { router } from "@/router"
import { useConfig, useUser } from "@/store"
import { cn } from "@/utils/style"
import { ReactNode, useEffect, useState } from "react"
import { JknAlert, JknIcon } from ".."

type MenuItem = {
  icon: IconName | ReactNode
  title: string
  path: string
  handler?: () => void
}

const MenuRight = () => {
  const [pathname, setPathname] = useState(router.state.location.pathname)

  useEffect(() => {
    const s = router.subscribe(s => {
      setPathname(s.location.pathname)
    })

    return () => {
      s()
    }
  }, [])

  const user = useUser(s => s.user)


  const menus: MenuItem[] = [
    {
      icon: <JknIcon.Svg name="stock" size={24} />,
      title: '图表',
      path: '/app/stock'
    },
    {
      icon: <JknIcon.Svg name="push" size={24} />,
      title: '榜单',
      path: '/app/push'
    },
    // {
    //   icon: <JknIcon.Svg name="financial" size={24} />,
    //   title: '财务',
    //   path: '/finance'
    // },
    {
      icon: <JknIcon.Svg name="alarm" size={24} />,
      title: '警报',
      path: '/app/stock/alarm'
    },
    {
      icon: <JknIcon.Svg name="group" size={24} />,
      title: "群聊",
      path: "/chat",
    },
  ]

  // const [auth, toastNotAuth] = useAuthorized('vcomment')

  const onNav = (path: string) => {
    if (path === "/chat") {
      if (user?.permission && user.permission.chat === true) {
        if (useConfig.getState().ip === 'CN') {
          JknAlert.info({
            content: '根据中国大陆地区相关政策要求，此项功能暂不面向中国大陆地区用户开放，感谢理解！Due to regulatory requirements in Mainland China, This feature is not available in Mainland China.Thanks for your understanding​',
            title: '服务不可用'
          })
          return
        }
        window.open(
          `${window.location.origin}/chat`,
          "whatever",
          "hideit,height=750,width=1200,resizable=yes,scrollbars=yes,status=no,location=no"
        )
        return
      } else {
        onNav("/app/mall")
        return
      }
    }




    if (path.startsWith('/app/stock')) {
      const search = new URLSearchParams(window.location.search)
      const symbol = search.get('symbol') ?? 'QQQ'

      if (window.location.pathname.startsWith('/app/stock/alarm') && pathname === '/app/stock/alarm') {
        router.navigate(`/app/stock?symbol=${symbol}`)
        return

      }
      router.navigate(`${path}?symbol=${symbol}`)
    } else {
      router.navigate(path)
    }
  }

  return (
    <div className="px-0.5 box-border space-y-3 pt-3 flex h-full flex-col items-center text-secondary">
      {menus.map(item => (

        <div className="text-center  cursor-pointer hover:text-primary" key={item.title} onClick={() => onNav(item.path)}
          onKeyDown={() => { }}>
          <div
            className={cn("flex flex-col items-center cursor-pointer hover:bg-accent w-8 h-[28px] justify-center rounded-xs", pathname === item.path && 'bg-primary/30')}
          >
            <div className={cn('flex', pathname === item.path ? 'text-primary' : '')}>
              {
                item.icon
              }
            </div>
          </div>
          <span className={cn('text-xs leading-[24px]]', pathname === item.path ? 'text-primary' : '')}>
            {item.title}
          </span>
        </div>
      ))}
      <style jsx>{`
             {
              .active-icon {
                filter: invert(50%) sepia(96%) saturate(6798%)
                  hue-rotate(227deg) brightness(99%) contrast(94%);
              }

              .active-text {
                color: hsl(var(--primary));
              }
            }
          `}</style>
    </div>
  )
}

export default MenuRight
