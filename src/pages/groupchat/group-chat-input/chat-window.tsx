import {
  type ClipboardEvent,
  type DragEvent,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  type CSSProperties
} from 'react'
import { type InputBoxResult, useInput } from './useInput'
import { useToast } from '@/hooks'
import { useChatNoticeStore } from '@/store/group-chat-new'
import { Button } from '@/components'
import xss from 'xss'

const ChatWindow = forwardRef(
  (
    props: {
      handleSend: (msgListData: InputBoxResult) => void
      className?: string
      style?: CSSProperties
      showSendButton?: boolean
    },
    ref
  ) => {
    const [htmlValue, setHtmlValue] = useState('')
    const { insertImage, exportMsgData, insertContent } = useInput({
      editorKey: 'xc-chat-input'
    })
    const { reEditData } = useChatNoticeStore()
    const { toast } = useToast()
    useImperativeHandle(ref, () => {
      return {
        addEmoji: (emoji: string) => {
          const tgt = document.getElementById('xc-chat-input')
          if (tgt) {
            setHtmlValue(tgt.innerHTML + emoji)
          }
        },
        insertImage,
        insertContent,
        dealSend
      }
    })

    // 插入文件
    const insertFile = (file: File) => {
      const URL = window.URL || window.webkitURL
      const url = URL.createObjectURL(file)
      if (file.type.includes('image')) {
        const sizeAllow = file.size / 1024 / 1024 <= 5
        if (!sizeAllow) {
          toast({ description: '图片限制最大5M' })
          return
        }
        insertImage(url, file)
      } else {
        toast({ description: '暂不支持发送此类文件' })
      }
    }

    // 处理图片和文件在input框中的显示逻辑
    const handleFileAndImageInsert = (item: any) => {
      const file = item.getAsFile()

      insertFile(file)
    }

    const pasteItem = (e: ClipboardEvent<HTMLDivElement>) => {
      if (!e.clipboardData?.items) {
        return
      }
      return new Promise((resolve, reject) => {
        for (let i = 0, len = e.clipboardData.items.length; i < len; i++) {
          const item = e.clipboardData.items[i]
          if (item.kind === 'string') {
            const type = item.type
            item.getAsString((str: string) => {
              resolve({
                type,
                text: str
              })
            })
          } else if (item.kind === 'file') {
            handleFileAndImageInsert(item)
          } else {
            reject(new Error('不允许复制这种类型!'))
          }
        }
      })
    }

    const handlePaste = async (e: ClipboardEvent<HTMLDivElement>) => {
      const data = e.clipboardData.getData('Text')
      if (data) {
        document.execCommand('insertText', false, data)
        e.preventDefault()
      } else {
        for (let i = 0, len = e.clipboardData.items.length; i < len; i++) {
          const item = e.clipboardData.items[i]
          if (item.kind === 'file') {
            handleFileAndImageInsert(item)
            e.preventDefault()
          }
        }
      }
    }

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const copyItems = e.dataTransfer.items
      for (let i = 0; i < copyItems.length; i++) {
        // 字符串
        if (copyItems[i].kind === 'string') {
          if (e.dataTransfer.effectAllowed === 'copy') {
            copyItems[i].getAsString((str: string) => {
              insertContent(str)
            })
          }
        }
        // 文件
        if (copyItems[i].kind === 'file') {
          handleFileAndImageInsert(copyItems[i])
        }
      }
    }

    const dealSend = () => {
      const tgt = document.getElementById('xc-chat-input')
      if (tgt) {
        const msgListData = exportMsgData()
        if (!msgListData || (msgListData.msgData.length === 0 && msgListData.needUploadFile.length === 0)) {
          return
        }
        typeof props.handleSend === 'function' && props.handleSend(msgListData)

        tgt.innerHTML = ''
        setHtmlValue('')
      }
    }

    // 重新编辑
    useEffect(() => {
      if (reEditData?.text !== '') {
        const tgt = document.getElementById('xc-chat-input')
        if (tgt) {
          // tgt.innerHTML = reEditData.text;
          const cleanText = xss(reEditData.text)
          setHtmlValue(cleanText)
        }
      }
    }, [reEditData])

    return (
      <>
        <div
          id="xc-chat-input"
          data-placeholder="按 Ctrl + Enter 换行，按 Enter 发送"
          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.keyCode !== 13) {
              //非回车
              return
            }
            if (e.keyCode === 13 && e.ctrlKey) {
              // ctrl+Enter不处理
              document.execCommand('insertText', false, '\n')
              return
            }
            e.preventDefault()
            dealSend()
          }}
          style={{
            height: props.showSendButton === true ? 'calc(100% - 30px)' : '100%',
            ...props.style
          }}
          onDragOver={e => {
            e.preventDefault()
          }}
          onDrop={handleDrop}
          className=" w-full chat-window"
          dangerouslySetInnerHTML={{ __html: htmlValue }}
          contentEditable
          onPaste={handlePaste}
          onChange={e => {
            const tgt = document.getElementById('xc-chat-input')
            if (tgt) {
              const cleanText = xss(tgt.innerHTML)
              setHtmlValue(cleanText)
            }
          }}
        />
        {props.showSendButton === true && (
          <div className="flex justify-end pr-2">
            <Button
              size="mini"
              onClick={() => {
                dealSend()
              }}
            >
              发送
            </Button>
          </div>
        )}

        <style jsx>
          {`
            .chat-window {
              padding: 6px 10px;
              overflow-y: auto;
              box-sizing: border-box;

              img {
                max-width: 200px !important;
                max-height: 200px !important;
                object-content: fit;
                padding: 0 !important;
                margin: 0 !important;
              }
            }
            .chat-window:empty:before {
              content: attr(data-placeholder);
              color: #bbb;
            }
            .chat-window:focus:before {
              content: none;
            }
          `}
        </style>
      </>
    )
  }
)

export default ChatWindow
