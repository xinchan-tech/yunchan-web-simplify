import { cn } from "@/utils/style"
import { router } from "@/router"
import { ReactNode, useEffect, useState } from "react"
import { useToken, useUser } from "@/store"
import { useAuthorized, useToast } from "@/hooks"
import { JknIcon } from ".."

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
      title: '个股盘口',
      path: '/stock/trading'
    },
    {
      icon: <JknIcon.Svg name="push" size={20} />,
      title: '特色推送',
      path: '/push'
    },
    {
      icon: <JknIcon.Svg name="financial" size={20} />,
      title: '财务估值',
      path: '/stock/finance'
    },
    {
      icon: <JknIcon.Svg name="group" size={20} />,
      title: "讨论社群",
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
    <div className="px-0.5 box-border space-y-1.5 py-[20px] flex flex-col items-center">
      {menus.map(item => (
        <div
          key={item.title}
          onClick={() => {
            if (item.path === "/chat-group") {
              if (!token) {
                toast({
                  title: "请先登录",
                })
                return
              }

              if (user?.permission && user.permission.chat === true) {
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
          className={cn("flex flex-col items-center cursor-pointer hover:bg-accent w-8 h-8 justify-center rounded-xs", pathname === item.path && 'bg-primary/30')}
        >
          <div className={cn('inline-block h-[20px]', pathname === item.path ? 'text-primary' : '')}>
            {
              item.icon
            }
          </div>
          {/* <div className={cn('w-8 text-center text-sm text-[#555555]', pathname === item.path && 'active-text')}>
            {item.title}
          </div> */}
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
      ))}
    </div>
  )
}

export default MenuRight
