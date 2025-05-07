import { router } from "@/router"
import { useConfig, useUser } from "@/store"
import { cn } from "@/utils/style"
import { ReactNode, useCallback, useEffect, useState } from "react"
import { JknAlert, JknIcon } from ".."
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getAlarmLogsList, getAlarmLogUnreadCount } from "@/api"
import WKSDK from "wukongimjssdk"
import { useAppEvent } from "@/utils/event"

type MenuItem = {
  icon: IconName | ReactNode
  title: string
  path: string
  count?: number
  handler?: () => void
}

const MenuRight = () => {
  const [pathname, setPathname] = useState(router.state.location.pathname)
  const queryClient = useQueryClient()

  useEffect(() => {
    const s = router.subscribe(s => {
      setPathname(s.location.pathname)
    })

    return () => {
      s()
    }
  }, [])

  const unRead = useQuery({
    queryKey: [getAlarmLogUnreadCount.cacheKey],
    queryFn: getAlarmLogUnreadCount
  })

  const user = useUser(s => s.user)

  const messageCount = useQuery({
    queryKey: ['chat-im-session'],
    queryFn: () => WKSDK.shared()
      .conversationManager.sync(),
    select: (data) => {
      return data.reduce((acc, item) => acc + item.unread, 0)
    },
    refetchInterval: 1000 * 60,
  })

  useAppEvent('alarm', useCallback(() => {
    queryClient.setQueryData([getAlarmLogUnreadCount.cacheKey], (oldData: any) => {
      return {count: (oldData?.count ?? 0) + 1}
    })
  }, []))


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
    {
      icon: <JknIcon.Svg name="alarm" size={24} />,
      title: '警报',
      path: '/app/stock/alarm',
      count: unRead.data?.count,
    },
    {
      icon: <JknIcon.Svg name="group" size={24} />,
      title: "群聊",
      path: "/chat",
      count: messageCount.data,
    },
  ]


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
          "hideit,height=850,width=1200,resizable=yes,scrollbars=yes,status=no,location=no"
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
            className={cn("flex flex-col items-center cursor-pointer hover:bg-accent w-8 h-[28px] justify-center rounded-xs relative", pathname === item.path && 'bg-primary/30')}
          >
            <div className={cn('flex', pathname === item.path ? 'text-primary' : '')}>
              {
                item.icon
              }
            </div>
            {item.count ? (
              <div className="absolute top-0 right-0 bg-destructive rounded-full size-3 flex items-center justify-center text-xs text-foreground">
                <span className="scale-75">{item.count > 9 ? '9+' : item.count}</span>
              </div>
            ) : null}
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
