import { HoverCard, HoverCardArrow, HoverCardContent, HoverCardTrigger, JknAlert, JknAvatar, JknIcon, JknModal, Label, RadioGroup, RadioGroupItem } from "@/components"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToken, useUser } from "@/store"
import { Outlet, useLocation } from "react-router"
import { ChannelList } from "./components/channel-list"
import { chatManager, useChatStore } from "./lib/store"
import { useConnectIM } from "./lib/subscribe"
import { useMessageListener } from "./lib/hooks"
import { useCallback, useEffect } from "react"
import { chatEvent } from "./lib/event"
import { ChannelTransform, ConversationTransform, MessageTransform } from "./lib/transform"
import WKSDK, { type MessageListener, type ChannelInfoListener, type ConversationListener } from "wukongimjssdk"


const CommunityPage = () => {
  const user = useUser(s => s.user)
  const token = useToken(s => s.token)
  useConnectIM()

  useMessageListener(useCallback((e) => {
    MessageTransform.toChatMessage(e).then((r) => {
      chatEvent.emit('updateMessage', r)
    })
  }, []))

  useEffect(() => {
    const handler: ConversationListener = (e) => {
      ConversationTransform.toSession(e).then(r => {
        chatEvent.emit('updateSession', r)
      })
    }
    WKSDK.shared().conversationManager.addConversationListener(handler)

    const channelHandler: ChannelInfoListener = (e) => {
      chatEvent.emit('updateChannel', ChannelTransform.toChatChannel(e))
    }

    WKSDK.shared().channelManager.addListener(channelHandler)

    const cmdHandler: MessageListener = (e) => {
      MessageTransform.toChatMessage(e).then((r) => {
        chatEvent.emit('updateMessage', r)
      })
    }

    WKSDK.shared().chatManager.addCMDListener(cmdHandler)


    return () => {
      WKSDK.shared().conversationManager.removeConversationListener(handler)
      WKSDK.shared().channelManager.removeListener(channelHandler)
      WKSDK.shared().chatManager.removeCMDListener(cmdHandler)
    }
  })

  if (!token) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">

      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="w-[64px] border-r-primary items-stretch flex flex-col">
        <div className="px-2.5 my-2.5">
          <JknAvatar className="size-12 rounded" title={user?.realname} src={user?.avatar} />
        </div>
        <div>
          <Menu />
        </div>
        <div className="mt-auto">
          <Setting />
        </div>
      </div>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}

export default CommunityPage

const menus = [
  { title: '讨论社群', icon: 'group', path: '/community' },
  { title: 'live', icon: 'live', path: '/community/live' },
]

const Menu = () => {
  const path = useLocation()
  return (
    <div className="mt-4">
      {
        menus.map(item => (
          <HoverCard openDelay={300} closeDelay={300} key={item.title}>
            <HoverCardTrigger asChild>
              <div key={item.title} className="w-full flex items-center justify-center cursor-pointer size-[64px] hover:bg-accent" data-check={path.pathname === item.path}>
                <JknIcon.Svg name={item.icon as IconName} size={24} />
              </div>
            </HoverCardTrigger>

            <HoverCardContent align="center" side="bottom" className="w-fit py-1 px-2 text-sm">
              <HoverCardArrow width={10} height={4} className="text-accent fill-accent" />
              {item.title}
            </HoverCardContent>
          </HoverCard>

        ))
      }
    </div>
  )
}

const Setting = () => {
  const config = useChatStore(s => s.config)

  const user = useUser(s => s.user)


  const onTimeZoneChange = (value: string) => {
    const timezone = value as any
    const format = timezone === 'us' ? 'time' : config.timeFormat
    chatManager.setTimeFormat({ timezone, format })
  }

  const canChangeChannel = user?.in_channel_status === '1'

  const onFormatChange = (value: string) => {
    const format = value as any
    if (config.timezone === 'us' && format === 'ago') {
      JknAlert.toast('美东时间只支持显示完整时间')

      return
    }
    chatManager.setTimeFormat({ timezone: config.timezone, format })
  }


  return (
    <JknModal
      title="设置"
      footer={null}
      trigger={
        <div className="flex items-center justify-center size-[64px] hover:bg-accent cursor-pointer">
          <JknIcon.Svg name="setting" />
        </div>
      }
    >
      <div className="min-h-[300px] px-4 box-border w-[500px]">
        <div className="flex items-center justify-between py-4">
          <span className="text-tertiary">社群设置</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {
                  canChangeChannel ? (
                    <ChannelList>
                      <div className="bg-primary rounded px-4 py-2 cursor-pointer">
                        更换社群
                      </div>
                    </ChannelList>
                  ) : (
                    <div className="rounded px-4 py-2 cursor-pointer bg-accent">
                      更换社群
                    </div>
                  )
                }
              </TooltipTrigger>
              <TooltipContent className="bg-accent">
                <span className="inline-block w-[400px] text-tertiary text-xs">
                  App会员每次付费周期可更换一次社群，更换后将自动退出原来的社群
                </span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-start justify-between py-4">
          <span className="text-tertiary">时间显示</span>
          <div className="space-y-4">
            <div>
              <RadioGroup
                className="flex items-center space-x-4"
                value={config.timezone}
                onValueChange={onTimeZoneChange}
              >
                <div className="flex items-center">
                  <RadioGroupItem value="local" id="chat-group-time-zone-local" />
                  <Label className="ml-2" htmlFor="chat-group-time-zone-local">
                    本地时间
                  </Label>
                </div>
                <div className="flex items-center">
                  <RadioGroupItem value="us" id="chat-group-time-zone-us" />
                  <Label className="ml-2" htmlFor="chat-group-time-zone-us">
                    美东时间
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <RadioGroup
                className="flex items-center space-x-4"
                value={config.timeFormat}
                onValueChange={onFormatChange}
              >
                <div className="flex items-center">
                  <RadioGroupItem value="ago" id="chat-group-time-format-ago" />
                  <Label className="ml-2" htmlFor="chat-group-time-format-ago">
                    相对时间
                  </Label>
                </div>
                <div className="flex items-center">
                  <RadioGroupItem value="time" id="chat-group-time-format-time" />
                  <Label className="ml-2" htmlFor="chat-group-time-format-time">
                    完整时间
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
      </div>
    </JknModal>
  )
}