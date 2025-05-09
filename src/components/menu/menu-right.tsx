import { router } from "@/router"
import { chatManager, useConfig, useToken, useUser } from "@/store"
import { cn } from "@/utils/style"
import { ReactNode, useCallback, useEffect, useState } from "react"
import { JknAlert, JknBadge, JknIcon } from ".."
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getAlarmLogUnreadCount, loginImService } from "@/api"
import WKSDK from "wukongimjssdk"
import { useAppEvent } from "@/utils/event"
import { BroadcastChannelMessageType, TCBroadcast } from "@/utils/broadcast"

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
  const token = useToken(s => s.token)

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
    queryFn: getAlarmLogUnreadCount,
    enabled: !!token,
  })

  const user = useUser(s => s.user)

  const messageCount = useQuery({
    queryKey: ['chat-im-session'],
    queryFn: () => WKSDK.shared()
      .conversationManager.sync().then(r => r.reduce((acc, item) => acc + item.unread, 0)),
    enabled: !!token,
  })

  useEffect(() => {
    const unsubscribe = TCBroadcast.on(BroadcastChannelMessageType.CommunityOpen, () => {
      WKSDK.shared().disconnect()
    })
    const unsubscribe2 = TCBroadcast.on(BroadcastChannelMessageType.CommunityUnRead, (e) => {
      queryClient.setQueryData(['chat-im-session'], () => {
        return e.data.data.count
      })
    })
    const unsubscribe3 = TCBroadcast.on(BroadcastChannelMessageType.CommunityClose, () => {
      WKSDK.shared().connect()
    })
    return () => {
      unsubscribe()
      unsubscribe2()
      unsubscribe3()
    }
  }, [])

  useEffect(() => {
    if (!token || !user?.username) {
      return
    }

    const localConfig = chatManager.getWsConfig()

    loginImService()

    WKSDK.shared().config.uid = user.username
    WKSDK.shared().config.token = token
    WKSDK.shared().config.addr = localConfig.addr
    WKSDK.shared().config.deviceFlag = localConfig.deviceFlag
    WKSDK.shared().config.heartbeatInterval = 10 * 1000

    const handlerMessage = () => {
      queryClient.setQueryData(['chat-im-session'], (oldData: any) => {
        return (oldData ?? 0) + 1
      })
    }

    WKSDK.shared().chatManager.addCMDListener(handlerMessage)
    WKSDK.shared().chatManager.addMessageListener(handlerMessage)
    const openState = localStorage.getItem('chat-open-state')
    if (!openState) {
      WKSDK.shared().connectManager.connect()
    }

    return () => {
      WKSDK.shared().chatManager.removeCMDListener(handlerMessage)
      WKSDK.shared().chatManager.removeMessageListener(handlerMessage)
      WKSDK.shared().disconnect()
    }
  }, [token, user?.username])


  useAppEvent('alarm', useCallback(() => {
    queryClient.setQueryData([getAlarmLogUnreadCount.cacheKey], (oldData: any) => {
      return { count: (oldData?.count ?? 0) + 1 }
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
        // const openState = localStorage.getItem('chat-open-state')

        // if (openState) {
        //   window.open('javascript:;', 'tc-community')
        // } else {

        // }
        window.open(
          `${window.location.origin}/chat`,
          "tc-community",
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
              <JknBadge.Number max={99} number={item.count} className="absolute -right-0.5 top-0" />
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
