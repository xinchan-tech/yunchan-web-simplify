import type { GroupChannelItem } from '@/api'
import { Button, JknIcon } from '@/components'
import { useMemo } from 'react'
import ChatAvatar from '../../chat-avatar'

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
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <div
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

const GroupChannelCard = (props: {
  data: GroupChannelItem
  onJoin: () => void
  joinDisabled?: boolean
}) => {
  const { data } = props

  return (
    <div className="flex justify-between flex-shrink-0 card-container border-b-primary">
      <div className="flex flex-1">
        <div className="avatar-box">
          <ChatAvatar
            data={{
              name: data.name,
              avatar: data.avatar,
              uid: data.account
            }}
            className="w-[64px] h-[64px]"
          />
        </div>
        <div className="group-info ml-6">
          <div className="mb-2 text-lg">{data.name}</div>
          <GroupTag tags={data.tags} total={data.total_user} />
          <div className="group-desc text-sm text-tertiary mt-2">{data.brief}</div>
          <div className="group-desc text-sm mt-2">共{data.total_user}人</div>
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
            onClick={() => {
              typeof props.onJoin === 'function' && props.onJoin()
            }}
            style={{
              backgroundColor: props.joinDisabled ? '#575757' : '#2962FF'
            }}
            disabled={props.joinDisabled}
          >
            {props.joinDisabled === true ? '已加入' : '加入'}
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

export default GroupChannelCard
