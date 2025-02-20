import { useState } from 'react'

import { Input } from '@/components'
import { cn } from '@/utils/style'
import { useGroupChatShortStore } from '@/store/group-chat-new'
import { useQuery } from '@tanstack/react-query'
import { getGroupChannels, joinGroupByInviteCode } from '@/api'
import type { getGroupChannelsParams, GroupChannelItem } from '@/api'
import GroupChannelCard from './group-channel-card'
import JoinGroup from '../join-group'
import type { GroupData } from '../../group-channel'
import FullScreenLoading from '@/components/loading'
import { useToast } from '@/hooks'

type GroupCategoryValue = '1' | '2' | '3'

type GroupCategory = {
  label: string
  value: GroupCategoryValue
}

const JoinGroupContent = (props: { onSuccess: () => void; type?: string }) => {
  const [currentCategory, setCurrentCategory] = useState<GroupCategoryValue>('1')
  const [keywords, setKeywords] = useState('')
  const { conversationWraps } = useGroupChatShortStore()
  const [curGroupData, setCurGroupData] = useState<GroupData | null>(null)
  const { toast } = useToast()

  const category: GroupCategory[] = [
    {
      label: '热门',
      value: '1'
    }
  ]

  const option = {
    queryKey: [getGroupChannels.cacheKey, currentCategory, keywords],
    queryFn: () => {
      let params: getGroupChannelsParams = {
        type: currentCategory,
        keywords
      }
      if (props.type === 'change') {
        if (!keywords) {
          return Promise.resolve([])
        }

        params = {
          type: currentCategory,
          re_code: keywords
        }
      }
      return getGroupChannels(params)
    }
  }
  const [openJoinMask, setOpenJoinMask] = useState(false)

  const { data, isFetching } = useQuery(option)

  const judgeIsJoined = (account: string) => {
    let res = false
    if (Array.isArray(conversationWraps) && conversationWraps.length > 0) {
      res = conversationWraps.some(wrap => wrap.channel.channelID === account)
    }
    return res
  }

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
      {(isFetching === true || changeGroupLoading === true) && <FullScreenLoading fullScreen={false} />}
      <div className="top-area">
        <div className="flex justify-center">
          <div className=" border-dialog-border rounded-sm  bg-accent top-area-search  w-[600px]">
            <Input
              className="border-none placeholder:text-tertiary"
              placeholder={props.type === 'change' ? '请输入邀请码' : '请输入群名称'}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setKeywords(e.currentTarget.value)
                }
              }}
              size={'sm'}
            />
          </div>
        </div>
        {props.type !== 'change' && (
          <div className="flex tag-conts">
            {category.map((item: GroupCategory) => (
              <div
                onClick={() => {
                  setCurrentCategory(item.value)
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    // Enter or Space key
                    setCurrentCategory(item.value)
                  }
                }}
                key={item.value}
                className={cn('mr-4 tag-cont-item', item.value === currentCategory && 'tag-active')}
              >
                {item.label}
              </div>
            ))}
          </div>
        )}
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
      </div>
      <style jsx>{`
        .content-box {
          position: relative;
        }
        .title {
          line-height: 36px;
        }
        .top-area {
          height: 120px;
          background-color: rgb(20, 21, 25);
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
          height: 420px;
          overflow-y: auto;
        }
        .mask {
          position: absolute;
          z-index: 100;
          left: 0;
          right: 0;
          bottom: 0;
          top: 0;

          background: rgba(0, 0, 0, 0.3); /* 半透明背景 */

          backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  )
}

export default JoinGroupContent
