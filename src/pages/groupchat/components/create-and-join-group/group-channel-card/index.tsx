import type { GroupChannelItem } from '@/api'
import ChatAvatar from '../../chat-avatar'
import { useMemo } from 'react'
import { Button, JknIcon } from '@/components'

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

      {taglist.map((Item, index) => {
        return (
          <div key={Item + index} className="group-tag text-xs">
            {Item}
          </div>
        )
      })}
      <style jsx>{`
        .group-tag {
          height: 18px;
          display: flex;
          align-items: center;
          padding: 0 6px;
          border-radius: 4px;
          background-color: rgb(35, 35, 35);
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
    <div className="flex justify-between  flex-shrink-0 card-container">
      <div className="flex flex-1">
        <div className="avatar-box">
          <ChatAvatar
            data={{
              name: data.name,
              avatar: data.avatar,
              uid: data.account
            }}
            className="w-[60px] h-[60px]"
          />
        </div>
        <div className="group-info ml-2">
          <div className="mb-1 text-sm">{data.name}</div>
          <GroupTag tags={data.tags} total={data.total_user} showMember />
          {/* <div className="flex mb-1">
            <div className="group-tag text-xs">
              <JknIcon
                name="ic_top_2"
                className="mr-1"
                style={{ width: "14px", height: "14px" }}
              />
              {data.total_user}
            </div>
            {taglist.map((Item, index) => {
              return (
                <div key={Item + index} className="group-tag text-xs">
                  {Item}
                </div>
              );
            })}
          </div> */}
          <div className="group-desc text-xs text-gray-600">社群简介：{data.brief}</div>
        </div>
      </div>
      <div className="group-price">
        <div className="flex w-full justify-center mb-2 text-gray-500 items-baseline">
          <span className="text-lg font-bold">${data.price}/</span>
          <span className="text-sm">月</span>
        </div>
        <div className="flex w-full justify-center ">
          <Button
            size="sm"
            onClick={() => {
              typeof props.onJoin === 'function' && props.onJoin()
            }}
            style={{
              backgroundColor: props.joinDisabled ? 'rgb(35,35,35)' : 'rgb(49,86,245)'
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
            padding: 10px 80px;
            width: 100%;
            box-sizing: border-box;
          }
          .card-container:hover {
            background-color: rgb(39, 40, 43);
          }
          .group-price {
            width: 150px;
          }
          .group-info {
            max-width: calc(100% - 100px);
            flex: 1;
          }
          .avatar-box {
            width: 60px;
            height: 60px;
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
