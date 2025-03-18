import { getChatNameAndAvatar } from "@/api"
import { useQuery } from "@tanstack/react-query"
import WKSDK from "wukongimjssdk"

interface RevokeTextRecordProps {
  revoker?: string
  sender?: string
  onReEdit: () => void
}

export const RevokeRecord = ({ revoker, sender }: RevokeTextRecordProps) => {
  const revokerInfo = useQuery({
    queryKey: [getChatNameAndAvatar.cacheKey, revoker],
    queryFn: () => getChatNameAndAvatar({ type: '1', id: revoker! })
  })
  const uid = WKSDK.shared().config.uid
  return (
    <div className="text-center">
      {
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
      }
    </div>
  )
}