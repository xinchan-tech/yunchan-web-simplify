import { getChatNameAndAvatar } from "@/api"
import { ChatMessageType } from "@/store"
import { useQueries, useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { WKSDK, type Message } from "wukongimjssdk"

interface TextRecordProps {
  message: Message,

}

export const TextRecord = (props: TextRecordProps) => {
  const { message } = props
  const mentions = message.content.mentions?.uids as any[]

  const mentionUser = useQueries({
    queries: mentions?.map(mention => ({
      queryKey: [getChatNameAndAvatar.cacheKey, mention],
      queryFn: () => getChatNameAndAvatar({ type: '1', id: mention })
    })) ?? [],
    combine: (results) => {
      const _map: Record<string, string> = {}

      results.forEach((result, index) => {
        if (result.data) {
          _map[mentions![index]] = result.data.name
        }
      })
      return _map
    }
  })

  if (message.contentType !== ChatMessageType.Text) {
    return null
  }


  const getNormalText = (text: string) => {
    const segments: ReactNode[] = []

    text.split('\n').forEach((line, index) => {
      segments.push(
        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
        <span key={line + index}>
          {line}
          <br />
        </span>
      )
    })

    if (mentions?.length) {
      mentions.forEach((mention, index) => {
        const name = mentionUser[mention]
        if (name) {
          segments.push(
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            <span key={mention + index} className="bg-[#FFC440]">
              &nbsp;
              @{name}
            </span>
          )
        }
      })
    }
  }

  return (
    <>
      123
      {
        message.remoteExtra.revoke ? (
          <RevokeTextRecord revoker={message.remoteExtra.revoker} sender={message.fromUID} onReEdit={() => { }} />
        ) : (
          getNormalText(message.content.text)
        )
      }
    </>
  )
}

interface RevokeTextRecordProps {
  revoker?: string
  sender?: string
  onReEdit: () => void
}

const RevokeTextRecord = ({ revoker, sender }: RevokeTextRecordProps) => {
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