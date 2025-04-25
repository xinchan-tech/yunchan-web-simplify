import { type GroupChannelItem, getChatChannels, joinGroupByInviteCode } from "@/api"
import { Button, JknAlert, JknIcon, JknModal, JknSearchInput, SkeletonLoading } from "@/components"
import { useMutation, useQuery } from "@tanstack/react-query"
import { type PropsWithChildren, useMemo, useState } from "react"
import { UserAvatar } from "./user-avatar"
import { useUser } from "@/store"


export const ChannelList = (props: PropsWithChildren) => {
  const [keywords, setKeywords] = useState<string>()

  const channels = useQuery({
    queryKey: [getChatChannels.cacheKey, '1', keywords],
    queryFn: () => {
      // if(!keywords) return Promise.resolve([])
      return getChatChannels({
        type: '1',
        account: keywords
      })
    }
  })

  return (
    <JknModal
      footer={null}
      title="加入社群"
      trigger={
        props.children
      }
    >
      <div className="h-full content-box w-[785px]">
        <div className="top-area">
          <div className="flex items-center px-10">
            <JknIcon name="hot-fire" />
            <span>热门</span>
            <JknSearchInput
              rootClassName="border border-solid rounded-lg border-border text-tertiary w-[324px] ml-auto bg-transparent"
              className="placeholder:text-secondary"
              placeholder="请输入邀请码"
              onSearch={v => setKeywords(v)}
            />
          </div>
        </div>
        <div className="bottom-area">
          {
            channels.isLoading ? (
              <SkeletonLoading count={4} />
            ) : (
              channels.data?.map((channel: GroupChannelItem) => {
                return (
                  <GroupChannelCard
                    key={channel.account}
                    channel={channel}
                  />
                )
              })
            )
          }
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
    </JknModal>
  )
}

const GroupChannelCard = (props: {
  channel: GroupChannelItem
}) => {
  const { channel } = props
  const refreshUser = useUser(s => s.refreshUser)

  const joinChannel = useMutation({
    mutationFn: () => {
      return joinGroupByInviteCode({
        channel_id: channel.account,
        type: '2'
      })
        .then(() => {
          JknAlert.success('更换群聊成功')
          refreshUser()
        })
    },
    onError: (e) => {
      JknAlert.error(e.message)
    }
  })


  return (
    <div className="flex justify-between flex-shrink-0 card-container border-b-primary">
      <div className="flex flex-1">
        <div className="avatar-box">
          <UserAvatar
            type="2"
            uid={channel.account}
            src={channel.avatar}
            size={64}
            shape="circle"
          />
        </div>
        <div className="group-info ml-6">
          <div className="mb-2 text-lg">{channel.name}</div>
          <GroupTag tags={channel.tags} total={channel.total_user} />
          <div className="group-desc text-sm text-tertiary mt-2">{channel.brief}</div>
          <div className="group-desc text-sm mt-2">共{channel.total_user}人</div>
        </div>
      </div>
      <div className="group-price">
        <div className="flex w-full justify-center mb-2  items-baseline">
          {/* <span className="text-2xl font-bold">${data.price}</span>
          <span className="text-sm">/月</span> */}
        </div>
        <div className="flex w-full justify-center ">
          <Button
            size="sm"
            className="text-foreground w-[108px] h-10 leading-10 text-sm"
            style={{
              backgroundColor: channel.in_channel ? '#575757' : '#2962FF'
            }}
            disabled={channel.in_channel === 1}
            loading={joinChannel.isPending}
            onClick={() => joinChannel.mutate()}
          >
            {channel.in_channel ? '已加入' : '加入'}
          </Button>
        </div>
      </div>
      <style jsx>
        {`
          .card-container {
            padding: 14px 40px;
            width: 100%;
            box-sizing: border-box;
          }
          .card-container:hover {
            background-color: rgb(39, 40, 43);
          }
          .group-price {
            margin-top: 40px;
            width: 150px;
          }
          .group-info {
            max-width: calc(100% - 100px);
            flex: 1;
          }
          .avatar-box {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            overflow: hidden;
          }
          .avatar-box img {
            width: 60px;
            height: 60px;
          }
          .group-name-avatar {
            width: 60px;
            height: 60px;
            font-size: 40px;
            color: #fff;
            text-align: center;
            line-height: 60px;
            background-color: rgba(7, 140, 143);
          }
        `}
      </style>
    </div>
  )
}

export const GroupTag = (props: {
  tags: string
  total?: number | string
  showMember?: boolean
}) => {
  const { tags, total, showMember } = props

  const taglist = useMemo(() => {
    let result: string[] = []
    if (tags) {
      result = tags.split(/[,，]/)
    }
    if (result.length > 0 && result[result.length - 1] === '') {
      result.pop()
    }
    return result
  }, [tags])
  return (
    <div className="flex mb-1 flex-wrap">
      {showMember === true && (
        <div className="group-tag text-xs">
          <JknIcon name="ic_top_2" className="mr-1" style={{ width: '14px', height: '14px' }} />
          {total}
        </div>
      )}

      {taglist.map((item, index) => {
        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            key={item + index}
            className="group-tag text-sm"
            style={{
              background:
                index === 0
                  ? 'rgba(34, 171, 148, 0.4)'
                  : index === 1
                    ? 'rgba(41, 98, 255, 0.4)'
                    : 'rgba(46, 46, 46, 1)',
              color: index === 0 ? '#22AB94' : index === 1 ? '#2962FF' : '#B8B8B8'
            }}
          >
            {item}
          </div>
        )
      })}
      <style jsx>{`
        .group-tag {
          height: 28px;
          display: flex;
          align-items: center;
          box-sizing: border-box;
          padding: 1px 12px;
          border-radius: 300px;
          background-color: hsl(var(--accent));
          margin-right: 6px;
        }
      `}</style>
    </div>
  )
}