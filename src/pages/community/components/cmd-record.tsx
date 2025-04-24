import { useQuery } from '@tanstack/react-query'
import WKSDK, { type Message, type Channel } from 'wukongimjssdk'
import { fetchUserInChannel } from '../../lib/utils'

interface CmdTextRecordProps {
  message: Message
}

export const CmdRecord = ({ message }: CmdTextRecordProps) => {
  const uid = WKSDK.shared().config.uid
  return (
    <div className="text-center text-xs text-tertiary my-2.5">
      {/* {
        revoker === uid ? (
          <span>你 撤回了一条消息</span>
        ) : (
          <span>{revokerInfo.data?.name ?? ''} 撤回了一条消息</span>
        )
      }
      {
        revoker === uid && sender === uid ? (
          <span className="text-xs cursor-pointer text-primary ml-2">
            重新编辑
          </span>
        ) : null
      } */}
    </div>
  )
}
