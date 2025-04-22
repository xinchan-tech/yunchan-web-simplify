import type { OverlayTemplate } from '@/plugins/jkn-kline-chart'
import type { DrawOverlayParams } from '../types'
import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { parseNumber } from "@/utils/string"
import { Button } from "@/components/ui/button"
import { nanoid } from "nanoid"
import { createRoot } from "react-dom/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useMount } from "ahooks"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { createOverlayTemplate } from "../utils"

export const RemarkOverlay = createOverlayTemplate<DrawOverlayParams & { text?: string, fontSize?: number }>({
  name: 'remark',
  totalStep: 3,
  onPressedMoveEnd: (e) => {
    e.overlay.onDrawEnd?.(e)
    return true
  },
  onRightClick: (e) => {
    e.preventDefault?.()
    return true
  },
  onDoubleClick: (e) => {
    const { overlay, preventDefault, chart } = e
    preventDefault?.()
    const { text = '文本', fontSize = 16 } = overlay.extendData ?? ({} as any)
    renderEditModal(text, fontSize).then(r => {
      if (r) {
        const { text, fontSize } = r as { text: string, fontSize: number }
        chart.overrideOverlay({
          id: overlay.id,
          extendData: {
            ...overlay.extendData,
            text,
            fontSize
          }
        })
        overlay.onDrawEnd?.(e)
      }
    })
    return true
  },
  createPointFigures: ({ coordinates, overlay }) => {
    if (coordinates.length < 2) {
      return []
    }

    const { text = '文本', fontSize = 16 } = overlay.extendData

    return [
      {
        type: 'remark',
        attrs: {
          coordinates: coordinates,
          text: text?.split('\n') || ['文本'],
          fontSize
        },
        styles: {
          color: overlay.extendData.color
        }
      }
    ]
  }
})

const renderEditModal = (text: string, fontSize: number) => {
  return new Promise((resolve) => {
    let rootEl = document.getElementById('overlay-remark-wrapper')

    if (!rootEl) {
      const el = document.createElement('div')
      el.id = 'overlay-remark-wrapper'
      document.body.appendChild(el)
      rootEl = el
    }

    const container = document.createElement('div')
    rootEl.appendChild(container)
    container.id = `overlay-remark-${nanoid(8)}`

    const root = createRoot(container)

    const destroy = () => {
      // root.unmount()
    }

    root.render(
      <EditContent
        text={text}
        fontSize={fontSize}
        onClose={() => {
          resolve(undefined)
          root.unmount()
          container.remove()
        }}
        onOk={(text, fontSize) => {
          resolve({ text, fontSize })
          root.unmount()
          container.remove()
        }}
      />
    )
  })
}

interface EditContentProps {
  text: string
  fontSize: number
  onClose: () => void
  onOk: (text: string, fontSize: number) => void
}

const EditContent = (props: EditContentProps) => {
  const [text, setText] = useState(props.text || '文本')
  const [fontSize, setFontSize] = useState(props.fontSize || 16)
  const [open, setOpen] = useState(false)

  useMount(() => {
    setOpen(true)
  })

  const _onClose = () => {
    setOpen(false)
    setTimeout(() => {
      props.onClose?.()
    }, 300)
  }

  const _onOk = () => {
    props.onOk(text, fontSize)
    _onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && _onClose()}>
      <DialogContent className="w-[660px] h-[320px] flex flex-col box-border p-2.5">
        <DialogHeader>
          <DialogTitle asChild>
            <span>编辑备注</span>
          </DialogTitle>
        </DialogHeader>
        <VisuallyHidden>
          <DialogDescription />
        </VisuallyHidden>
        <Textarea className="w-full flex-1 box-border mt-2" value={text} onChange={(e) => setText(e.target.value)} placeholder="请输入文本" rows={4} />
        <div className="flex py-2.5">
          <div className="flex items-center">
            <span className="whitespace-nowrap">字号: &nbsp;</span>
            <Input value={fontSize} onChange={(e) => setFontSize(parseNumber(e.target.value, 16))} />
          </div>
          <div className="ml-auto">
            <Button className="w-24" variant="outline" onClick={_onClose}>取消</Button>
            <Button className="w-24 ml-2" onClick={_onOk}>确定</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
