import { useQuery } from '@tanstack/react-query'
import WKSDK, { type Channel } from 'wukongimjssdk'
import { fetchUserInChannel } from '../../lib/utils'

interface RevokeTextRecordProps {
  revoker?: string
  sender?: string
  channel?: Channel
  onReEdit: () => void
}

export const RevokeRecord = ({ revoker, sender, channel }: RevokeTextRecordProps) => {
  const revokerInfo = useQuery({
    queryKey: ['get-revoke-record-user', revoker, channel?.channelID],
    queryFn: () => fetchUserInChannel(channel!, revoker!),
    enabled: !!channel
  })

  const uid = WKSDK.shared().config.uid
  return (
    <div className="text-center text-xs text-tertiary my-2.5">
      <span>{revokerInfo.data?.name ?? ''} 撤回了一条消息</span>
      {revoker === uid && sender === uid ? (
        <span className="text-xs cursor-pointer text-primary ml-2">重新编辑</span>
      ) : null}
    </div>
  )
}
