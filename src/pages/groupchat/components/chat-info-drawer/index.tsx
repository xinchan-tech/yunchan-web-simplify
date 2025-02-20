import { cn } from '@/utils/style'
import { ChevronRight } from 'lucide-react'
import { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useModal } from '@/components'
import ChatHistory from './chat-history'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  position?: 'left' | 'right'
  width?: number
  children: React.ReactNode
  showCloseButton?: boolean
  title?: string
}

export const Drawer = (props: DrawerProps) => {
  const { isOpen, onClose, position = 'right', width = 300, children, showCloseButton = true } = props

  const drawerRef = useRef<HTMLDivElement>(null)

  // 处理点击抽屉外部区域关闭抽屉
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen, onClose])

  const drawerStyle: React.CSSProperties = {
    width: `${width}px`,
    transform: isOpen ? 'translateX(0)' : `translateX(${position === 'left' ? '-100%' : '100%'})`
  }

  return ReactDOM.createPortal(
    <div ref={drawerRef} className={cn('bg-[#393A3F] drawer-contaner', position)} style={drawerStyle}>
      <div className="title h-[40px] leading-[40px] pl-2">
        <span>{props.title}</span>
      </div>
      <div className="drawer-body">{children}</div>
      <style jsx>{`
            {
                .drawer-contaner {
                    position: fixed;
                    height: 100vh;
                    top: 0;
                     transition: transform 0.3s ease;
                    width: 300px;
                    
                }
                    .drawer-contaner.right {
                         right: 0;
                        transform: translateX(100%);
                     }
                    .drawer-contaner.left {
                        left: 0;
                        transform: translateX(-100%);
                    }
                    .drawer-body {
                        height: calc(100% - 40px)
                    }
            }
        `}</style>
    </div>,
    document.body
  )
}

const ChatInfoDrawer = (props: Omit<DrawerProps, 'children'> & { channelID: string }) => {
  const chatHistoryModal = useModal({
    footer: null,
    closeIcon: true,
    title: '聊天记录',
    className: 'w-[600px]',
    content: <ChatHistory channelID={props.channelID} />
  })
  return (
    <Drawer {...props} title="聊天信息">
      <div className="pl-2 pr-2">
        <div
          className="flex justify-between h-[40px] text-gray-400 items-center cursor-pointer settingItem"
          onClick={() => {
            chatHistoryModal.modal.open()
          }}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              // Enter or Space key
              chatHistoryModal.modal.open()
            }
          }}
        >
          <span className="text-sm ">聊天记录</span>
          <ChevronRight />
        </div>
      </div>
      {chatHistoryModal.context}
      <style jsx>
        {`
        {
            .settingItem:hover {
                color: hsl(var(--primary))
            }

        }
            `}
      </style>
    </Drawer>
  )
}

export default ChatInfoDrawer
