import { getChatNameAndAvatar } from '@/api'
import { ChatMessageType, useStockList } from '@/store'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Fragment, type ReactNode } from 'react'
import { type Message, type MessageText, WKSDK } from 'wukongimjssdk'
import { UsernameSpan } from '../../components/username-span'

type TextSegment = {
  text: string
  type: 'text' | 'stock' | 'hyperlink'
  startIndex: number
  endIndex: number
}

interface TextRecordProps {
  message: Message
}

export const TextRecord = (props: TextRecordProps) => {
  const { message } = props
  const content = message.content as MessageText
  const mentions = content.mention?.uids

  // const mentionUser = useQueries({
  //   queries: mentions?.map(mention => ({
  //     queryKey: [getChatNameAndAvatar.cacheKey, mention],
  //     queryFn: () => getChatNameAndAvatar({ type: '1', id: mention })
  //   })) ?? [],
  //   combine: (results) => {
  //     const _map: Record<string, string> = {}

  //     results.forEach((result, index) => {
  //       if (result.data) {
  //         _map[mentions![index]] = result.data.name
  //       }
  //     })
  //     return _map
  //   }
  // })

  if (message.contentType !== ChatMessageType.Text) {
    return null
  }

  const getNormalText = (text: string) => {
    const segments: ReactNode[] = []
    text.split('\n').forEach((line, index, arr) => {
      segments.push(
        <Fragment key={`${line + index + message.messageID}fragment`}>
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
          {/* biome-ignore lint/security/noDangerouslySetInnerHtmlWithChildren: <explanation> */}
          {/* biome-ignore lint/suspicious/noArrayIndexKey: <explanation> */}
          <span
            className="chat-text-item"
            key={line + index}
            dangerouslySetInnerHTML={{ __html: stockCodeParse(hyperlinkParse(line)) }}
          ></span>
          {index !== arr.length - 1 && <br />}
        </Fragment>
      )
    })

    if (mentions?.length) {
      mentions.forEach((mention, index) => {
        segments.push(
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <span key={mention + index + message.messageID} className="text-[#FFC440]">
            <span>&nbsp;@</span>
            <UsernameSpan uid={mention} channel={message.channel}>
              &nbsp;
            </UsernameSpan>
          </span>
        )
      })
    }

    return segments
  }

  return <>{getNormalText(message.content.text)}</>
}

/**
 * 超链接解析
 */
const hyperlinkParse = (raw: string) => {
  const reg = /((http|https):\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?/g

  return raw.replace(reg, url => {
    return `<a href="${url}" target="_blank">&nbsp;${url}&nbsp;</a>`
  })
}

/**
 * 股票代码解析
 * $开头
 */
const stockCodeParse = (raw: string) => {
  const reg = /\$[A-Za-z0-9]{1,6}/g

  return raw.replace(reg, code => {
    const stockMap = useStockList.getState().listMap
    if (stockMap[code.slice(1)]) {
      return `<span class="text-[#8CABFF] cursor-pointer" data-stock-code="${code.slice(1)}">${code}</span>`
    }
    return code
  })
}
