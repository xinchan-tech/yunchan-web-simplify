import { ContextMenu, ContextMenuTrigger, JknIcon, Skeleton } from '@/components'
import { useGroupChatShortStore } from '@/store/group-chat-new'
import ChatAvatar from '../components/chat-avatar'

import { useMemo } from 'react'
import { useMemberSetting } from '../hooks'

const GroupMembers = (props: { total: string | number }) => {
  const subscribers = useGroupChatShortStore(state => state.subscribers)
  const fetchingSubscribers = useGroupChatShortStore(state => state.fetchingSubscribers)
  const groupDetailData = useGroupChatShortStore(state => state.groupDetailData)

  const { renderContextMenu } = useMemberSetting()
  const skeletonArr = useMemo(() => {
    const result = []
    const len = props.total as number
    for (let i = 0; i < len; i++) {
      result.push(i)
    }

    return result
  }, [props.total])

  return (
    <div className="h-full">
      <div className="group-notice p-2">
        <div className="flex items-center text-base text-foreground">群公告</div>
        <div className="group-notice-content text-tertiary text-sm">{groupDetailData?.notice || ''}</div>
      </div>
      <div className="group-members p-2 box-border">
        <div className="flex items-center text-base text-foreground">群成员({subscribers.length})</div>
        {fetchingSubscribers === true &&
          skeletonArr.map(idx => {
            return <Skeleton key={idx} style={{ background: '#555' }} className="mt-[6px] h-5" />
          })}
        {fetchingSubscribers === false &&
          subscribers.map(item => {
            return (
              <div key={item.uid} className="member-item flex items-center justify-between">
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <div className="flex h-full items-center w-[200px]">
                      <ChatAvatar data={item} size="sm" />
                      <div className="flex flex-1 h-full items-center">
                        <div className="member-name overflow-hidden text-ellipsis whitespace-nowrap">{item.name}</div>
                        {item.orgData?.type === '2' && <JknIcon name="owner" />}
                        {item.orgData?.forbidden === '1' && <JknIcon name="forbidden" />}
                        {item.orgData?.type === '1' && <JknIcon name="manager" />}
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  {renderContextMenu(item)}
                </ContextMenu>
              </div>
            )
          })}
      </div>

      <style jsx>{`
         {
          .group-notice {
            height: 200px;
            border-bottom: 1px solid rgb(50, 50, 50);
          }
          .group-members {
            height: calc(100% - 220px);
            overflow-y: auto;
          }
          .box-title {
            height: 30px;
            font-size: 12px;
            color: rgb(118, 125, 136);
            padding-left: 10px;
          }
          .member-item {
            margin-top: 6px;
            height: 20px;
          }

          .member-avatar {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            margin-right: 6px;
          }
          .member-name {
            margin-left: 6px;
            max-width: calc(100% - 50px);
            font-size: 14px;
          }
          .group-notice-content {
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 9;
            -webkit-box-orient: vertical;
          }
        }
      `}</style>
    </div>
  )
}

export default GroupMembers
