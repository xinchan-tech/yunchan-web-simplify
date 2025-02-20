import MsgCard from '../../components/msg-card'

import WKSDK, { Channel, ChannelTypePerson, type Message } from 'wukongimjssdk'
import type { MessageWrap } from '../../Service/Model'
import { useChatNoticeStore } from '@/store/group-chat-new'
import { CHAT_STOCK_JUMP } from '@/app'

export const RevokeText = (props: {
  data: {
    revoker: string
    sender: string
    originType: number
    originText: string
  }
}) => {
  const { data } = props
  const fromUser = WKSDK.shared().channelManager.getChannelInfo(new Channel(data.revoker, ChannelTypePerson))
  const { setReEditData } = useChatNoticeStore()
  const loginid = WKSDK.shared().config.uid

  return (
    <div className="message-system">
      {`${fromUser?.title}撤回了一条消息`}
      {/* 自己发的自己撤回的文本消息才能重新编辑 */}
      {data.revoker === WKSDK.shared().config.uid && data.sender === loginid && data.originType === 1 && (
        <span
          className="cursor-pointer text-xs text-primary ml-2"
          onClick={() => {
            setReEditData({
              text: data.originText,
              timestap: new Date().getTime()
            })
          }}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              // Enter or Space key
              setReEditData({
                text: data.originText,
                timestap: new Date().getTime()
              })
            }
          }}
        >
          重新编辑
        </span>
      )}
      <style jsx>{`
        .message-system {
          margin: 20px auto;
          color: rgb(90, 90, 90);
          font-size: 12px;
          text-align: center;
        }
      `}</style>
    </div>
  )
}
const jumpToStock = (symbol: string) => {
  const channel = new BroadcastChannel('chat-channel')
  channel.postMessage({
    type: CHAT_STOCK_JUMP,
    payload: symbol
  })
}
interface HighlightDollarWordsProps {
  text: string
}
export const HighlightDollarWords: React.FC<HighlightDollarWordsProps> = ({ text }) => {
  // 定义正则表达式，用于匹配以 $ 开头且后面跟着大写字母的字符串
  const regex: RegExp = /\$[A-Z]+/g
  // 用于存储分割后的字符串部分
  const parts: (string | React.ReactElement)[] = []
  let lastIndex: number = 0
  // 使用正则表达式的 exec 方法查找匹配项
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    // 将匹配项之前的字符串部分添加到 parts 数组中
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    // 将匹配项添加到 parts 数组中，并添加高亮样式
    const str = match[0]
    parts.push(
      <span
        className="text-primary cursor-pointer"
        key={match.index}
        onClick={() => {
          const symbol = str.replace('$', '')
          jumpToStock(symbol)
        }}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            // Enter or Space key
            const symbol = str.replace('$', '')
            jumpToStock(symbol)
          }
        }}
      >
        {str}
      </span>
    )
    // 更新 lastIndex 为匹配项的结束位置
    lastIndex = regex.lastIndex
  }
  // 将最后一个匹配项之后的字符串部分添加到 parts 数组中
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  // 返回渲染后的 JSX 元素
  return <div>{parts}</div>
}

const TextCell = (props: { message: Message; messageWrap?: MessageWrap }) => {
  const { message, messageWrap } = props

  // 先注释 以后可能用的到
  // const parts = messageWrap?.parts;
  // const elements = new Array<JSX.Element>();

  // const getCommonText = (k: number, part: Part) => {
  //   const texts = part.text.split("\n");

  //   return (
  //     <span
  //       key={`${message.clientMsgNo}-text-${k}`}
  //       className="message-text-commontext"
  //     >
  //       {texts.map((text, i) => {
  //         return (
  //           <span
  //             key={`${message.clientMsgNo}-common-${i}`}
  //             className="message-text-richtext"
  //           >
  //             {text}
  //             {i !== texts.length - 1 ? <br /> : undefined}
  //           </span>
  //         );
  //       })}
  //     </span>
  //   );
  // };

  // const getMentionText = (k: number, part: Part) => {
  //   // console.log(part, 'partpart')
  //   let latestName: any = part.text;
  //   // if(part.data?.uid) {
  //   //   latestName = '@' + WKSDK.shared().channelManager.getChannelInfo(
  //   //     new Channel(part.data.uid, ChannelTypePerson)
  //   //   )?.title;
  //   // }

  //   return (
  //     <span
  //       key={`${message.clientMsgNo}-mention-${k}`}
  //       className={cn(
  //         "message-text-richmention",
  //         message.send ? "message-text-send" : "message-text-recv"
  //       )}
  //     >
  //       {latestName}
  //     </span>
  //   );
  // };
  // if (parts && parts.length > 0) {
  //   let i = 0;
  //   for (const part of parts) {
  //     part.text.split("\n");
  //     if (part.type === PartType.text) {
  //       elements.push(getCommonText(i, part));
  //     } else if (part.type === PartType.mention) {
  //       elements.push(getMentionText(i, part));
  //     }
  //     // todo 后面写
  //     // else if (part.type === PartType.emoji) {
  //     //   elements.push(this.getEmojiText(i, part));
  //     // } else if (part.type === PartType.link) {
  //     //   elements.push(this.getLinkText(i, part));
  //     // }
  //     i++;
  //   }
  // }

  const getNormalText = () => {
    let text = new Array<JSX.Element>()
    if (messageWrap?.content.text) {
      const goodText = messageWrap.content.text.split('\n')
      goodText.forEach((str: string, idx: number) => {
        text.push(
          <span key={str + idx}>
            <HighlightDollarWords text={str} />
          </span>
        )
        if (idx !== goodText.length - 1) {
          text.push(<br key={`${str + idx}br`} />)
        }
      })
    }
    if (messageWrap?.content.mention && Array.isArray(messageWrap?.content.mention.uids)) {
      let mentoions = messageWrap.content.mention.uids.map((uid: string) => {
        const info = WKSDK.shared().channelManager.getChannelInfo(new Channel(uid, ChannelTypePerson))
        if (info) {
          return (
            <span key={uid} className="message-text-richmention">
              &nbsp;@{info.title}
            </span>
          )
        }
      })
      text.push(mentoions)
    }
    return text
  }

  return (
    <>
      {message.remoteExtra.revoke === true ? (
        <RevokeText data={message.remoteExtra.extra} />
      ) : (
        <MsgCard data={message}>{getNormalText()}</MsgCard>
      )}
      <style>
        {`
          .message-text-richmention {
            color: rgb(65,158,255)
          }
          
        `}
      </style>
    </>
  )
}

export default TextCell
