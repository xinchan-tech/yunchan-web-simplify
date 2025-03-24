import { cn } from "@/utils/style"
import { router } from "@/router"
import { ReactNode, useEffect, useState } from "react"
import { useConfig, useToken, useUser } from "@/store"
import { useAuthorized, useToast } from "@/hooks"
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
  const { token } = useToken()
  const { toast } = useToast()

  const menus: MenuItem[] = [
    {
      icon: <JknIcon.Svg name="stock" size={20} />,
      title: '图表',
      path: '/stock'
    },
    {
      icon: <JknIcon.Svg name="push" size={20} />,
      title: '榜单',
      path: '/push'
    },
    {
      icon: <JknIcon.Svg name="financial" size={20} />,
      title: '财务',
      path: '/finance'
    },
    {
      icon: <JknIcon.Svg name="alarm" size={20} />,
      title: '警报',
      path: '/stock/alarm'
    },
    {
      icon: <JknIcon.Svg name="group" size={20} />,
      title: "群聊",
      path: "/chat-group",
    },
  ]

  // const [auth, toastNotAuth] = useAuthorized('vcomment')

  const onNav = (path: string) => {
    if (!token && path !== '/app') {
      toast({
        title: '请先登录'
      })
      return
    }

    const search = new URLSearchParams(window.location.search)
    const symbol = search.get('symbol') ?? 'QQQ'

    // if(path === '/shout' && !auth()){
    //   toastNotAuth()
    //   return
    // }

    if (path.startsWith('/stock')) {
      router.navigate(`${path}?symbol=${symbol}`)
    } else {
      router.navigate(path)
    }
  }

  return (
    <div className="px-0.5 box-border space-y-2.5 py-[20px] flex h-full flex-col items-center text-secondary">
      {menus.map(item => (
        <div className="text-center" key={item.title}>
          <div
            onClick={() => {
              if (item.path === "/chat-group") {
                if (!token) {
                  toast({
                    title: "请先登录",
                  })
                  return
                }

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
                    "hideit,height=750,width=1000,resizable=yes,scrollbars=yes,status=no,location=no"
                  )
                } else {
                  onNav("/mall")
                }
              } else {
                onNav(item.path)
              }
            }}
            onKeyDown={() => { }}
            className={cn("flex flex-col items-center cursor-pointer hover:bg-accent w-8 h-6 justify-center rounded-xs", pathname === item.path && 'bg-primary/30')}
          >
            <div className={cn('inline-block h-[20px]', pathname === item.path ? 'text-primary' : '')}>
              {
                item.icon
              }
            </div>
          </div>
          <span className={cn('text-xs leading-none', pathname === item.path ? 'text-primary' : '')}>
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
