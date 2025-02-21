import { useRef, useState } from 'react'
import cacheManager from '../../messageCache'
import MsgScrollLoader from '../msg-scroll-loader'
import { type Message, MessageText, MessageImage, PullMode } from 'wukongimjssdk'
import { Convert } from '../../Service/convert'

import TextCell from '../../Messages/text'
import ImageCell from '../../Messages/Image'
import { Input, JknIcon } from '@/components'

const LIMIT = 20

// 过滤CMDtype和被撤回的消息
const filteRevokeMessages = (messages: Message[]) => {
  const result = [...messages]
  for (let i = 0; i < result.length; i++) {
    const msg = result[i]
    if (msg.content.cmd === 'messageRevoke') {
      if (msg.content.param?.message_id) {
        const revokeMsgId: string = msg.content.param?.message_id

        // const temp = result.splice(i, 1);
        // 目标消息位置
        result.forEach((m, targetMessagePos) => {
          if (m.messageID === revokeMsgId) {
            if (result[targetMessagePos]) {
              result[targetMessagePos].remoteExtra.revoke = true
              result[targetMessagePos].remoteExtra.extra.revoker = msg.fromUID
              result[targetMessagePos].remoteExtra.extra.sender = m.fromUID
              result[targetMessagePos].remoteExtra.extra.originType = m.contentType
              result[targetMessagePos].remoteExtra.extra.originText = m.content.text
              // result.splice(targetMessagePos, 0, temp[0]);
            }
          }
        })
      }
    }
  }
  return result.filter(msg => {
    const isTextOrImage = msg.content instanceof MessageText || msg.content instanceof MessageImage

    return isTextOrImage && !msg.remoteExtra.revoke
  })
}
const ChatHistory = (props: { channelID: string }) => {
  const { channelID } = props

  const [fetchParams, setFetchParams] = useState({
    limit: LIMIT,
    mode: PullMode.Down,
    start: 0,
    end: 0
  })
  const fetchData = async (params: {
    limit: number
    mode: PullMode
    start: number
    end: number
  }) => {
    const data = await cacheManager.getMessages(channelID, params)

    if (Array.isArray(data) && data.length > 0) {
      const res = data.map(msg => {
        return Convert.toMessage(msg)
      })
      return filteRevokeMessages(res)
    }
    return []
  }

  const firstMsg = useRef<Message | null>(null)
  const handlePageChange = (page: number) => {
    const params = {
      limit: LIMIT,
      mode: PullMode.Down,
      start: (firstMsg.current?.messageSeq || 1) - 1,
      end: 0
    }
    return params
  }
  const handleMessageChange = (messages: Message[]) => {
    firstMsg.current = messages[0]
  }

  return (
    <div className="p-4 h-[560px]">
      {/* <div className="flex items-center justify-center h-[40px] border-dialog-border rounded-sm  bg-accent">
        <JknIcon name="search" className="ml-4" />
        <Input
          className="border-none h-[40px] placeholder:text-tertiary"
          placeholder="搜索"
          onKeyDown={e => {
            if (e.key === 'Enter') {
            }
          }}
          size={'sm'}
        />
      </div> */}
      <div className="h-full pt-4 box-border">
        <MsgScrollLoader
          id="chat-history-container"
          fetchParams={fetchParams}
          rowKey="clientMsgNo"
          rowKeyPerfix="chathistory"
          fetchData={fetchData}
          onPageChange={handlePageChange}
          onMessageChange={handleMessageChange}
          reverse={false}
          renderItem={item => {
            return (
              <div id={`chathistory${item.clientMsgNo}`} key={item.clientMsgNo}>
                {item.content instanceof MessageText && <TextCell message={item} />}

                {item.content instanceof MessageImage && <ImageCell message={item} />}
              </div>
            )
          }}
        />
      </div>
    </div>
  )
}

export default ChatHistory
