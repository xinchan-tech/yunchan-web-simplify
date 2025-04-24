
import { type ChatMessageType, useStockList } from '@/store'
import { Fragment } from 'react'
import type { ChatMessageTypes } from "../lib/types"
import { nanoid } from "nanoid"

type TextSegment = {
  type: 'text' | 'stock' | 'hyperlink',
  text: string
}

type TextSegments = TextSegment[]

interface TextRecordProps {
  message: ChatMessageTypes<ChatMessageType.Text>
}

export const TextRecord = (props: TextRecordProps) => {
  const { message } = props
  // const content = 
  const texts = parseText(message.content)

  return (
    <span>
      {
        texts.map((lines, index) => (
          <span key={nanoid(8)} className="select-text">
            {
              lines.map(line => (
                <Fragment key={nanoid(8)}>
                  {{
                    text: <span className="chat-text-item select-text">{line.text}</span>,
                    stock: <span className="text-[#8CABFF] cursor-pointer select-text">{line.text}</span>,
                    hyperlink: <a href={line.text} target="_blank" className="text-[#8CABFF] cursor-pointer select-text" rel="noreferrer">{line.text}</a>
                  }[line.type]}
                </Fragment>
              ))
            }
            {
              index === texts.length - 1 ? null : <br />
            }
          </span>
        ))
      }
      {
        message.mentionAll ? (
          <span className="text-[#FFC440]">&nbsp; @所有人</span>
        ) : message.mentionUser.length ? (
          message.mentionUser.map((mention) => (
            <span key={nanoid()} className="text-[#FFC440] select-text">
              <span>&nbsp;@</span>
              {mention.name}
            </span>
          ))
        ) : null
      }
    </span>
  )
}

const parseText = (raw: string): TextSegments[] => {
  const groups: TextSegments[] = []
  let segments: TextSegments = []

  raw.split('\n').forEach(line => {
    let lastSegment: TextSegment | undefined = undefined
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (!lastSegment) {
        if (char === '$') {
          lastSegment = { type: 'stock', text: char }
        } else {
          lastSegment = { type: 'text', text: char }
        }
      } else if (lastSegment.type === 'stock') {
        // char不是英文和.判断stock已经结束
        if (!/^[A-Za-z\.]+$/.test(char)) {
          if (lastSegment.text.length === 1) {
            lastSegment.type = 'text'
            lastSegment.text += char
          } else {
            segments.push(lastSegment)
            if (char === '$') {
              lastSegment = { type: 'stock', text: char }
            } else {
              lastSegment = { type: 'text', text: char }
            }
          }
        } else {
          lastSegment.text += char
        }
      } else if (lastSegment.type === 'hyperlink') {
        // 判断超链接结束
        if (!/^[A-Za-z0-9\-\.]+$/.test(char)) {
          segments.push(lastSegment)
          if (char === '$') {
            lastSegment = { type: 'stock', text: char }
          } else {
            lastSegment = { type: 'text', text: char }
          }
        } else {
          lastSegment.text += char
        }
      } else {
        if (char === '$') {
          if (lastSegment) {
            segments.push(lastSegment)
          }
          lastSegment = { type: 'stock', text: char }
        } else {
          lastSegment.text += char

          //判断是否是超链接开头
          if (lastSegment.text.startsWith('http') || lastSegment.text.startsWith('https')) {
            lastSegment.type = 'hyperlink'
          }
        }
      }
    }
    

    if (lastSegment) {
      if(lastSegment.type === 'stock' && lastSegment.text.length === 1){
        lastSegment.type = 'text'
      }
      segments.push(lastSegment)
    }

    groups.push(segments)
    segments = []
    lastSegment = undefined
  })

  return groups
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
  const reg = /\$[A-Za-z\.]{1,6}/g

  return raw.replace(reg, code => {
    const stockMap = useStockList.getState().listMap
    if (stockMap[code.slice(1)]) {
      return `<span class="text-[#8CABFF] cursor-pointer" data-stock-code="${code.slice(1)}">${code}</span>`
    }
    return code
  })
}
