import { cn } from "@/utils/style"
import { router } from "@/router"
import { ReactNode, useEffect, useState } from "react"
import { useToken, useUser } from "@/store"
import { useToast } from "@/hooks"
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
      icon: <JknIcon.Svg name="stock" />,
      title: '个股盘口',
      path: '/stock/trading'
    },
    {
      icon: <JknIcon.Svg name="push" />,
      title: '特色推送',
      path: '/push'
    },
    {
      icon: <JknIcon.Svg name="financial" />,
      title: '财务估值',
      path: '/stock/financials'
    },
    {
      icon: <JknIcon.Svg name="group" />,
      title: "讨论社群",
      path: "/mall",
    },
  ]

  const onNav = (path: string) => {
    if (!token && path !== '/app') {
      toast({
        title: '请先登录'
      })
      return
    }

    const search = new URLSearchParams(window.location.search)
    const symbol = search.get('symbol') ?? 'QQQ'

    if (path.startsWith('/stock')) {
      router.navigate(`${path}?symbol=${symbol}`)
    } else {
      router.navigate(path)
    }
  }

  return (
    <div className="mt-3">
      {menus.map(item => (
        <div
          key={item.title}
          onClick={() => {
            if (item.path === "/mall") {
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
                onNav(item.path)
              }
            } else {
              onNav(item.path)
            }
          }}
          onKeyDown={() => { }}
          className="mb-4 flex flex-col items-center cursor-pointer"
        >
          <div className={cn(pathname === item.path && 'text-primary')}>
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
