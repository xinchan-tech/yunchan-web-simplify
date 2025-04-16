import { Button, HoverCard, HoverCardTrigger, JknIcon, Label, RadioGroup, RadioGroupItem } from '@/components'
import { useModal } from '@/components'
import { useUser } from '@/store'
import { cn } from '@/utils/style'
import ChatAvatar from '../components/chat-avatar'

import { APP_TO_CHAT_REFRESH_USER, CHAT_TO_APP_REFRESH_USER } from '@/app'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks'
import { useGroupChatStoreNew } from '@/store/group-chat-new'
import { useEffect, useRef } from 'react'
import WKSDK from 'wukongimjssdk'
import { JoinGroupContent } from '../components/create-and-join-group/join-group-content'

const GroupChatLeftBar = (props: {
  indexTab: 'chat' | 'live'
  onTabChange: (tab: 'chat' | 'live') => void
}) => {
  const { user, setUser } = useUser()

  const tabs: Array<{
    icon: IconName
    value: 'chat' | 'live'
  }> = [
    {
      icon: 'group',
      value: 'chat'
    },
    {
      icon: 'live',
      value: 'live'
    }
  ]

  const channel = useRef<BroadcastChannel>()
  useEffect(() => {
    channel.current = new BroadcastChannel('chat-channel')

    channel.current.onmessage = event => {
      if (event.data.type === APP_TO_CHAT_REFRESH_USER) {
        setUser({ ...event.data.payload })
      }
    }

    return () => {
      channel.current?.close()
    }
  }, [setUser])

  const onChannelChange = () => {
    if (user?.in_channel_status !== '1') return

    changeGroupModal.modal.open()
  }

  const settingModal = useModal({
    title: '设置',
    closeIcon: true,
    content: <SettingForm onChannelChange={onChannelChange} />,
    className: 'w-[500px]',
    onOk: () => settingModal.modal.close()
  })

  const changeGroupModal = useModal({
    content: (
      <JoinGroupContent
        onSuccess={() => {
          changeGroupModal.modal.close()
          settingModal.modal.close()
          WKSDK.shared().config.provider.syncConversationsCallback()
          // 通知app刷新用户信息
          channel.current?.postMessage({
            type: CHAT_TO_APP_REFRESH_USER
          })
        }}
        type="change"
      />
    ),
    className: 'w-[800px]',
    title: '更换群组',
    closeIcon: true,
    footer: null
  })

  return (
    <div className="w-[64px] left-bar-cont relative">
      <div className="left-bar-item flex justify-center">
        <ChatAvatar
          radius="8px"
          className="w-12 h-12"
          data={{
            avatar: user?.avatar || '',
            name: user?.realname || '',
            uid: user?.username || ''
          }}
        />
      </div>
      <div className="left-bar-item flex justify-center flex-wrap">
        {tabs.map(tab => {
          return (
            <div
              key={tab.value}
              onClick={() => {
                typeof props.onTabChange === 'function' && props.onTabChange(tab.value)
              }}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  // Enter or Space key
                  typeof props.onTabChange === 'function' && props.onTabChange(tab.value)
                }
              }}
              className={cn(
                'w-full h-16 flex flex-col justify-center items-center cursor-pointer hover:bg-accent',
                props.indexTab === tab.value && 'activebar'
              )}
            >
              <JknIcon.Svg name={tab.icon} />
            </div>
          )
        })}
      </div>
      <div
        className="flex justify-center items-center absolute bottom-3 left-0 w-full h-[50px] flex-col cursor-pointer"
        onClick={() => {
          settingModal.modal.open()
        }}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            // Enter or Space key
            settingModal.modal.open()
          }
        }}
      >
        <JknIcon.Svg name="setting" />
      </div>
      {settingModal.context}
      {changeGroupModal.context}
      <style jsx>
        {`
           {
            .left-bar-cont {
              padding: 20px 0;
              width: 68px;
              height: 100%;
              box-sizing: border-box;
            }
            .activebar {
              background-color: hsl(var(--accent))
            }
            .title {
              color:  #989898
            }
            .left-bar-item {
              width: 100%;
              min-height: 50px;
              border-radius: 8px;
              margin-bottom: 14px;
            }
          }
        `}
      </style>
    </div>
  )
}

interface SettingFormProps {
  onChannelChange: () => void
}

const SettingForm = (props: SettingFormProps) => {
  const timeFormat = useGroupChatStoreNew(s => s.timeFormat)
  const setTimeFormat = useGroupChatStoreNew(s => s.setTimeFormat)
  const { toast } = useToast()

  const onTimeZoneChange = (value: string) => {
    const timezone = value
    const format = timezone === 'us' ? 'time' : timeFormat.format
    setTimeFormat({ timezone, format })
  }

  const onFormatChange = (value: string) => {
    const format = value
    if (timeFormat.timezone === 'us' && format === 'ago') {
      toast({
        description: '美东时间只支持显示完整时间'
      })

      return
    }
    setTimeFormat({ timezone: timeFormat.timezone, format })
  }

  return (
    <div className="border-t-primary min-h-[300px] px-4 box-border">
      <div className="flex items-center justify-between py-4">
        <span className="text-tertiary">社群设置</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="bg-accent rounded px-4 py-2 cursor-pointer"
                onClick={props.onChannelChange}
                onKeyDown={() => {}}
              >
                更换社群
              </div>
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
              value={timeFormat.timezone}
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
              value={timeFormat.format}
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
  )
}

export default GroupChatLeftBar
