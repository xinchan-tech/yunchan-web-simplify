import { getChannelMembers, setChannelManager, setMemberForbidden } from "@/api"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, JknIcon, ScrollArea, Skeleton } from "@/components"
import { useChatStore, useUser } from "@/store"
import { useQuery } from "@tanstack/react-query"
import WKSDK, { type Subscriber } from "wukongimjssdk"
import ChatAvatar from "../components/chat-avatar"
import { chatEvent } from "../lib/event"
import to from "await-to-js"
import { useToast } from "@/hooks"
import { useSubscribesListener } from "../lib/hooks"
import { useCallback, useEffect } from "react"
import { hasForbidden, isChannelManager, isChannelOwner } from "../lib/utils"
import { nanoid } from "nanoid"
import { subscriberCache } from "../cache"
import { useImmer } from "use-immer"

interface ChannelMembersProps {
  owner: string
}

const useSubscribesWithCache = () => {
  const channel = useChatStore(s => s.lastChannel)
  const [subscribes, setSubscribes] = useImmer<Subscriber[]>([])

  useEffect(() => {
    if (!channel) {
      return
    }

    subscriberCache.getSubscribesByChannel(channel.channelID).then(subs => {
      setSubscribes(subs)
    })

  }, [channel, setSubscribes])


  useSubscribesListener(channel, useCallback((c) => {

    if (c.isEqual(channel!)) {
      const subscribes = WKSDK.shared().channelManager.getSubscribes(channel!)
      subscriberCache.updateByChannel(c.channelID, subscribes.map(s => {
        s.channel = channel!
        return s
      }))
      setSubscribes(subscribes)
    }
  }, [channel, setSubscribes]))

  return [subscribes, setSubscribes] as const
}

export const ChannelMembers = ({ owner }: ChannelMembersProps) => {
  const channel = useChatStore(s => s.lastChannel)
  const username = useUser(s => s.user?.username)
  const { toast } = useToast()
  const [subscribes] = useSubscribesWithCache()

  const subscribesQuery = useQuery({
    queryKey: [getChannelMembers.cacheKey, channel?.channelID],
    queryFn: () => WKSDK.shared().channelManager.syncSubscribes(channel!).then(() => {
      return WKSDK.shared().channelManager.getSubscribes(channel!)
    }),
    enabled: !!channel
  })

  const onReplayUser = (member: { name: string, uid: string }) => {
    chatEvent.emit('mentionUser', { userInfo: member, channelId: channel!.channelID })
  }

  const hasManageAuth = (member: Subscriber) => {
    return username && username === owner && member.orgData?.type !== '2'
  }

  const hasForbiddenAuth = (member: Subscriber) => {
    if (member.orgData?.type === '2') return false

    const self = WKSDK.shared().channelManager.getSubscribeOfMe(channel!)
    return self?.orgData.type === "1" || self?.orgData.type === "2"
  }

  const onChangeMemberManageAuth = async (member: Subscriber) => {
    const params = {
      channelId: channel!.channelID,
      username: member.uid,
      type: member.orgData?.type === '1' ? '0' : '1' as '0' | '1'
    }

    const [err] = await to(setChannelManager(params))

    if (err) {
      toast({
        description: err.message
      })
      return
    }

    toast({
      description: params.type === "1" ? "设置管理员操作成功" : "取消管理员操作成功"
    })

    subscribesQuery.refetch()
  }

  const onChangeMemberForbiddenAuth = async (member: Subscriber) => {
    const params = {
      channelId: channel!.channelID,
      uids: [member.uid],
      forbidden: member.orgData?.forbidden === '0' ? '1' : '0' as '0' | '1'
    }

    if (isChannelManager(member)) {
      toast({
        description: '请先取消对方管理员权限再拉黑'
      })

      return
    }

    const [err] = await to(setMemberForbidden(params))

    if (err) {
      toast({
        description: err.message
      })
      return
    }

    toast({
      description: params.forbidden === "1" ? "禁言操作成功" : "取消禁言操作成功"
    })

    subscribesQuery.refetch()
    // members.refetch()
  }

  // useSubscribesListener(channel, useCallback((c) => {
  //   if (c.isEqual(channel!)) {
  //     const subscribes = WKSDK.shared().channelManager.getSubscribes(channel!)
  //     subscriberCache.updateByChannel(c.channelID, subscribes)
  //   }
  // }, [channel]))

  return (
    <div className="chat-room-users h-full flex flex-col overflow-hidden">
      <div className="chat-room-users-title p-2 flex items-center">
        <div className="text">群成员</div>
        <div className="text-xs text-tertiary bg-accent rounded-xl px-1 min-w-4 text-center ml-1">{subscribes?.length}</div>
      </div>
      <ScrollArea className="chat-room-users-list flex-1">
        {
          subscribes?.map(member => (
            <ContextMenu key={member.uid}>
              <ContextMenuTrigger asChild>
                <div className="chat-room-users-item flex items-center p-2 box-border hover:bg-accent w-full overflow-hidden">
                  <ChatAvatar data={{ avatar: member.avatar, name: member.name, uid: member.uid }} className="h-6 w-6" size="sm" />
                  <div className="text-xs leading-6 ml-2 mr-1 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{member.name}</div>
                  <div className="">
                    {isChannelOwner(member) && <JknIcon name="owner" />}
                    {hasForbidden(member) && <JknIcon name="forbidden" />}
                    {isChannelManager(member) && <JknIcon name="manager" />}
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => onReplayUser(member)} >
                  <div className="text-xs text-secondary" onKeyDown={() => { }}>回复用户</div>
                </ContextMenuItem>
                {
                  hasManageAuth(member) && (
                    <ContextMenuItem onClick={() => onChangeMemberManageAuth(member)}>
                      <div className="text-xs text-secondary" onKeyDown={() => { }}>
                        {member.orgData?.type === '1' ? '取消管理员' : '设为管理员'}
                      </div>
                    </ContextMenuItem>
                  )
                }
                {
                  hasForbiddenAuth(member) && (
                    <ContextMenuItem onClick={() => { onChangeMemberForbiddenAuth(member) }}>
                      <div className="text-xs text-secondary" onKeyDown={() => { }}>
                        {member.orgData?.forbidden === '0' ? '添加黑名单' : '解除黑名单'}
                      </div>
                    </ContextMenuItem>
                  )
                }
              </ContextMenuContent>
            </ContextMenu>
          ))
        }
      </ScrollArea>
    </div>
  )
}

const MemberSkeleton = () => {
  return (
    <>
      {
        Array.from({ length: 5 }, (_) => (
          <div key={nanoid()} className="flex items-center space-y-2">
            <Skeleton animation={false} className="h-6 w-6 mr-1 rounded-full" />
            <Skeleton animation={false} className="h-6 w-24 ml-2" />
          </div>
        ))
      }
    </>
  )
}