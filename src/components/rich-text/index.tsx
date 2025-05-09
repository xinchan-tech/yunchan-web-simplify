import { useStockList } from "@/store"
import { cn } from "@/utils/style"
import type { HTMLAttributes } from "react"
import xss from "xss"

interface RichTextProps extends HTMLAttributes<HTMLDivElement> {
  text: string
}

export const RichText = ({text, className, ...props}: RichTextProps) => {
  const _text = xss(hyperlinkParse(stockCodeParse(text)), {
    css: false,
    onIgnoreTagAttr: (_tag, name, value) => {
      if (name.slice(0, 5) === "data-") {
        return `${name}="${value}"`;
      }
      if (name === "class") {
        return `${name}="${value}"`;
      }
    }
  })

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
    <div className={cn('whitespace-pre-wrap break-words', className)} {...props} dangerouslySetInnerHTML={{ __html: _text }} />
  )
}

/**
 * 超链接解析
 */
const hyperlinkParse = (raw: string) => {
  const reg = /((http|https):\/\/)([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?/g

  return raw.replace(reg, url => {
    return `<a href="${url}" class="!text-[#8CABFF]" target="_blank">&nbsp;${url}&nbsp;</a>`
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