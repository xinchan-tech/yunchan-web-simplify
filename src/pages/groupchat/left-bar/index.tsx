import { Button, JknIcon } from '@/components'
import ChatAvatar from '../components/chat-avatar'
import { useUser } from '@/store'
import { cn } from '@/utils/style'
import { useModal } from '@/components'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import JoinGroupContent from '../components/create-and-join-group/join-group-content'
import WKSDK from 'wukongimjssdk'
import { useEffect, useRef } from 'react'
import { APP_TO_CHAT_REFRESH_USER, CHAT_TO_APP_REFRESH_USER } from '@/app'

const GroupChatLeftBar = (props: {
  indexTab: 'chat' | 'live'
  onTabChange: (tab: 'chat' | 'live') => void
}) => {
  const { user, setUser } = useUser()

  const tabs: Array<{
    name: string
    icon: string

    value: 'chat' | 'live'
  }> = [
    {
      name: '消息',
      icon: 'group_chat',

      value: 'chat'
    },
    {
      name: '图文直播',
      icon: 'right_menu_5',

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
  }, [])

  const settingModal = useModal({
    title: '设置',
    footer: null,
    closeIcon: true,
    content: (
      <div className="p-5 min-h-[300px]">
        <div className="flex h-[40px] items-center">
          <div className="w-[100px] text-right">更换社群：</div>
          <div className="h-full flex items-center">
            <Button
              size={'sm'}
              disabled={user?.in_channel_status !== '1'}
              onClick={() => {
                changeGroupModal.modal.open()
              }}
            >
              更换
            </Button>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-4">
                    <JknIcon name="ic_tip1" className="rounded-none" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="w-[300px]">
                    App会员免费赠送的社群,每次付费周期均可更换一次输入邀请码提交后可更换至对应的社群更换社群后将自动退出原来的社群
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    ),
    className: 'w-[500px]'
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
    <div className="w-[68px] left-bar-cont relative">
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
                'w-12 h-12 flex flex-col justify-center items-center  mb-2',
                props.indexTab === tab.value && 'activebar'
              )}
            >
              <JknIcon className={cn(props.indexTab === tab.value && 'active-icon', 'rounded-none')} name={tab.icon} />
              <div className="text-xs mt-1 title">{tab.name}</div>
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
        <JknIcon className="rounded-none" name="settings_shallow" />
        <div className="text-center mt-2  text-xs text-[#989898]">设置</div>
      </div>
      {settingModal.context}
      {changeGroupModal.context}
      <style jsx>
        {`
           {
            .left-bar-cont {
              padding: 20px 10px;
              width: 68px;
              height: 100%;
              box-sizing: border-box;
              background-color: rgb(30, 32, 34);
            }
            .activebar {
              border-radius: 8px;
              background-color: rgb(53, 54, 55);
              img {
                filter: invert(50%) sepia(96%) saturate(6798%)
                  hue-rotate(227deg) brightness(99%) contrast(94%);
              }
            }
            .title {
              color:  #989898
            }
            .activebar .title {
              color: #6052ff;
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

export default GroupChatLeftBar
