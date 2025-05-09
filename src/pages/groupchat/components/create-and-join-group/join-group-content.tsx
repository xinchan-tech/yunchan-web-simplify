import { type ComponentProps, type PropsWithChildren, forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { getChatChannels, joinGroupByInviteCode } from '@/api'
import type { GroupChannelItem, getChatChannelsParams } from '@/api'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  JknIcon,
  JknSearchInput
} from '@/components'
import FullScreenLoading from '@/components/loading'
import { useToast } from '@/hooks'
import { useGroupChatShortStore } from '@/store/group-chat-new'
import { cn } from '@/utils/style'
import { useQuery } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import type { GroupData } from '../../group-channel'
import { JoinGroup } from '../join-group'
import GroupChannelCard from './group-channel-card'

type GroupCategoryValue = '1' | '2' | '3'

type GroupCategory = {
  label: string
  value: GroupCategoryValue
}

export const JoinGroupContent = (props: { onSuccess: () => void; type?: string }) => {
  const [currentCategory, setCurrentCategory] = useState<GroupCategoryValue>('1')
  const [keywords, setKeywords] = useState<string>()
  const [curGroupData, setCurGroupData] = useState<GroupData | null>(null)
  const { toast } = useToast()

  const option = {
    queryKey: [getChatChannels.cacheKey, currentCategory, keywords],
    queryFn: () => {
      let params: getChatChannelsParams = {
        type: currentCategory,
        account: keywords
      }
      if (props.type === 'change') {
        if (!keywords) {
          return Promise.resolve([])
        }

        params = {
          type: currentCategory,
          account: keywords
        }
      }
      return getChatChannels(params)
    }
  }
  const [openJoinMask, setOpenJoinMask] = useState(false)

  const { data, isFetching } = useQuery(option)

  const [changeGroupLoading, setChangeGroupLoading] = useState(false)
  const handleChangeGroup = (data: GroupChannelItem) => {
    setChangeGroupLoading(true)
    joinGroupByInviteCode({
      channel_id: data.account,
      type: '2'
    })
      .then(r => {
        if (r?.status === 1) {
          typeof props.onSuccess === 'function' && props.onSuccess()
          toast({
            description: '更换群聊成功'
          })
        }
      })
      .finally(() => {
        setChangeGroupLoading(false)
      })
  }

  return (
    <div className="w-full h-full content-box">
      {(isFetching === true || changeGroupLoading === true) && <FullScreenLoading fullScreen={false} />}
      <div className="top-area">
        <div className="flex items-center px-10">
          <JknIcon name="hot-fire" />
          <span>热门</span>
          <JknSearchInput
            rootClassName="border border-solid rounded-lg border-border text-tertiary w-[324px] ml-auto bg-transparent"
            className="placeholder:text-secondary"
            placeholder={props.type === 'change' ? '请输入邀请码' : '请输入群名称'}
            onSearch={v => setKeywords(v)}
          />
        </div>
      </div>
      <div className="bottom-area">
        {(data || []).map((channel: GroupChannelItem) => {
          return (
            <GroupChannelCard
              key={channel.account}
              joinDisabled={channel.in_channel !== 0}
              data={channel}
              onJoin={() => {
                if (props.type === 'change') {
                  handleChangeGroup(channel)
                } else {
                  setCurGroupData(channel)
                  setOpenJoinMask(true)
                }
              }}
            />
          )
        })}
        {/* <div className="flex justify-center mt-4 text-sm text-gray-600 cursor-pointer">
          加载更多
        </div> */}
        {openJoinMask === true && curGroupData && (
          <div className="mask">
            <JoinGroup
              data={curGroupData}
              onSuccess={props.onSuccess}
              type={props.type}
              onClose={() => {
                setOpenJoinMask(false)
              }}
            />
          </div>
        )}
      </div>
      <style jsx>{`
        .content-box {
          position: relative;
        }
        .title {
          line-height: 36px;
        }
        .top-area {
          height: 50px;
          border-bottom: 1px solid hsl(var(--border));
        }
        .top-area-search {
          margin-top: 30px;
          margin-bottom: 30px;
        }
        .tag-conts {
          padding-left: 80px;
        }
        .tag-cont-item {
          height: 22px;
          border-radius: 11px;
          line-height: 22px;
          width: 60px;
          text-align: center;
        }
        .tag-active {
          background-color: hsl(var(--primary));
        }
        .bottom-area {
          padding-top: 12px;
          padding-bottom: 20px;
          height: 570px;
          overflow-y: auto;
        }
        .mask {
          position: fixed;
          z-index: 999999;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;

          background: rgba(0, 0, 0, 0.3); /* 半透明背景 */

          backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  )
}

interface JoinGroupContentModalProps extends PropsWithChildren<ComponentProps<typeof JoinGroupContent>> {}
interface JoinGroupContentModalIns {
  open: () => void
}

export const JoinGroupContentModal = forwardRef<JoinGroupContentModalIns, JoinGroupContentModalProps>((props, ref) => {
  const divRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    open: () => {
      divRef.current?.click()
    }
  }))

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div ref={divRef}>{props.children}</div>
      </DialogTrigger>
      <DialogContent
        className="w-[800px] bg-chat-background"
        onPointerDownOutside={e => {
          e.stopPropagation()
          e.stopImmediatePropagation()
        }}
      >
        <DialogHeader className="bg-chat-background items-end !py-4 px-10">
          <DialogTitle asChild className="bg-chat-background">
            <DialogClose asChild className="w-6 h-6 !p-0 -z-0">
              <span className="hover:bg-accent !leading-6 text-center cursor-pointer !rounded">
                <JknIcon.Svg name="close" size={12} />
              </span>
            </DialogClose>
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-center" />
        {<JoinGroupContent onSuccess={props.onSuccess} type={props.type} />}
      </DialogContent>
    </Dialog>
  )
})
