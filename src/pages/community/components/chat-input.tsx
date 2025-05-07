import { JknAlert, JknIcon, JknModal, PopoverContent, PopoverTrigger } from '@/components'
import { ChatMessageType, useUser } from '@/store'
import emojiData from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { Popover } from '@radix-ui/react-popover'
import Image from '@tiptap/extension-image'
import { EditorContent, type JSONContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { type PropsWithChildren, forwardRef, useEffect, useId, useImperativeHandle, useMemo, useState } from 'react'
import { useImmer } from 'use-immer'
import { Reply, WKSDK } from 'wukongimjssdk'
import { type ChatEvent, chatEvent } from '../lib/event'
import { useChatStore } from "../lib/store"
import { ChatChannelType, type ChatMessage, type ChatSubscriber } from "../lib/types"
import { MessageTransform } from "../lib/transform"
import { VoteForm } from "./vote-form"
import { draftCache } from "../cache"

interface ChatInputProps {
  hasForbidden: boolean
  chatType: ChatChannelType
  inChannel: boolean
  channelReady: boolean
  me?: ChatSubscriber
  onSubmit?: (
    text?: JSONContent,
    extra?: {
      reply?: Reply
      mentions?: string[]
    }
  ) => void
}

interface ChatInputInstance {
  setInput: (str: string) => void
}

const extensions = [StarterKit, Image]



export const ChatInput = forwardRef<ChatInputInstance, ChatInputProps>((props, ref) => {
  const [mentionList, setMentionList] = useImmer<{ name: string; uid: string }[]>([])
  const [replyMessage, setReplyMessage] =
    useImmer<Nullable<{ name: string; text: string; uid: string; content: ChatMessage }>>(null)
  const channel = useChatStore(s => s.channel)

  const editor = useEditor({
    extensions,
    editable: true,
    editorProps: {
      attributes: {
        class: 'h-[148px]'
      },
      handlePaste: (_view, event) => {
        if (!editor?.isEditable) return false
        const items = event.clipboardData?.items

        if (!items) return false
        for (const item of Array.from(items)) {
          if (item.type.indexOf('image') !== -1) {
            event.preventDefault()
            const file = item.getAsFile()
            if (!file) continue
            editor?.commands.setImage({ src: URL.createObjectURL(file), title: file.name })
            return true
          }
        }

        return false
      },
      handleKeyDown: (_view, e) => {
        if (!editor?.isEditable) return false
        if (e.key === 'Enter') {
          if (e.ctrlKey) {
            editor?.commands.setHardBreak()
            return true
          }
          onSubmit()
          editor?.commands.clearContent()
          return true
        }

        return false
      },
      handleDrop: (_view, event) => {
        if (!editor?.isEditable) return false
        const files = event.dataTransfer?.files
        if (!files) return false
        for (const file of Array.from(files)) {
          if (!file.type.includes('image')) continue
          editor?.commands.setImage({ src: URL.createObjectURL(file), title: file.name })
        }
        return true
      }
    }
  })

  useImperativeHandle(ref, () => ({
    setInput: (str: string) => {
      editor?.commands.setContent(str)
    }
  }))

  const onSubmit = () => {
    if (!editor?.isEditable) return false
    const content = editor?.getJSON() as JSONContent
    const extra = {
      reply: undefined as any,
      mentions: mentionList.map(item => item.uid)
    }

    const mergerContent: JSONContent['content'] = []
    content.content?.forEach(item => {
      const last = mergerContent[mergerContent.length - 1]
      if (!last) {
        mergerContent.push(item)
        return
      }

      if (last.type === 'paragraph' && item.type === 'paragraph') {
        item.content?.forEach(c => {
          last.content?.push(
            { type: 'hardBreak' },
            c
          )
        })
        return
      }

      mergerContent.push(item)
    })

    content.content = mergerContent

    if (replyMessage) {
      const reply = new Reply()
      reply.fromUID = replyMessage.content.senderId
      reply.fromName = replyMessage.content.senderName
      reply.messageID = replyMessage.content.id
      reply.messageSeq = replyMessage.content.messageSeq
      if (MessageTransform.fromChatMessageToContent(replyMessage.content)) {
        reply.content = MessageTransform.fromChatMessageToContent(replyMessage.content)!
      } else {
        reply.content = WKSDK.shared().getMessageContent(1)
      }

      extra.reply = reply

    }


    props.onSubmit?.(content, extra)
    setMentionList([])
    setReplyMessage(null)
  }

  const onToolSelectEmoji = (e: string) => {
    if (!editor?.isEditable) return false
    editor?.commands.insertContent(e)
    editor?.commands.focus()
  }

  const onDollarClick = () => {
    if (!editor?.isEditable) return false
    editor?.commands.insertContent('$')
    editor?.commands.focus()
  }

  const onToolImageUpload = (fileUrl: string, name: string) => {
    if (!editor?.isEditable) return false
    editor?.commands.setImage({ src: fileUrl, title: name })
    editor?.commands.focus()
  }

  useEffect(() => {
    if (!channel) return

    draftCache.get(channel).then(draft => {
      if (!draft) return

      editor?.commands.setContent(draft.content)
    })

    const cancelMention = chatEvent.on('mention', ({ id, name }: ChatEvent['mention']) => {
      if (!editor?.isEditable) return false
      setReplyMessage(null)
      setMentionList(draft => {
        if (draft.some(item => item.uid === id)) return

        draft.push({ name, uid: id })
      })
    })


    const cancelCopy = chatEvent.on('copy', (message: ChatEvent['copy']) => {
      if (!editor?.isEditable) return false

      if (message.type === ChatMessageType.Text) {
        editor?.commands.insertContent(message.content)
      } else if (message.type === ChatMessageType.Image) {
        editor?.commands.setImage({ src: message.content })
      } else {
        JknAlert.error('不支持的消息类型')
      }

      editor?.commands.focus()
    })

    const cancelReply = chatEvent.on('reply', (message) => {
      if (!editor?.isEditable) return false

      setMentionList([])

      if (message.type === ChatMessageType.Text) {
        setReplyMessage({ name: message.senderName, text: message.content, uid: message.senderId, content: message })
      } else if (message.type === ChatMessageType.Image) {
        setReplyMessage({ name: message.senderName, text: '[图片]', uid: message.senderId, content: message })
      } else {
        JknAlert.error('不支持的消息类型')
      }

      editor?.commands.focus()
    })

    return () => {
      cancelMention()
      cancelCopy()
      cancelReply()
      setMentionList([])
      setReplyMessage(null)
      draftCache.updateOrSave({
        channel: channel,
        content: editor?.getJSON(),
        key: channel.id
      })
      editor?.commands.clearContent()

    }
  }, [channel, editor, setMentionList, setReplyMessage])

  const canInput = useMemo(() => {
    let _canInput = props.chatType === ChatChannelType.Public
    if (!_canInput) {
      if (props.chatType === ChatChannelType.OnlyManager) {
        _canInput = props.me?.isManager || props.me?.isOwner || false
      } else {
        _canInput = props.me?.isOwner || false
      }
    }

    return _canInput
  }, [props.chatType, props.me])


  useEffect(() => {
    editor?.setEditable(props.inChannel && !props.hasForbidden && canInput)
  }, [props.hasForbidden, props.inChannel, editor, canInput])


  return (
    <div className="chat-room-input h-full relative flex flex-col">
      {mentionList.length ? (
        <div className="flex items-center absolute text-sm left-0 -top-8 h-8 box-border px-3 leading-8 border-0 border-solid border-y border-[#2E2E2E] right-0 bg-[#0a0a0a]">
          <JknIcon.Svg name="close" className="cursor-pointer" size={12} onClick={() => setMentionList([])} />
          <span>&nbsp;&nbsp;回复用户: &nbsp;&nbsp;</span>
          <div className="flex items-center space-x-4">
            {mentionList.map(item => (
              <span key={item.uid}>@{item.name}</span>
            ))}
          </div>
        </div>
      ) : null}
      {replyMessage ? (
        <div className="flex items-center absolute text-sm left-0 -top-8 h-8 box-border px-3 leading-8 border-0 border-solid border-y border-[#2E2E2E] right-0 overflow-hidden bg-[#0a0a0a]">
          <JknIcon.Svg name="close" className="cursor-pointer" size={12} onClick={() => setReplyMessage(null)} />
          <span>&nbsp;&nbsp;{replyMessage.name}: &nbsp;&nbsp;</span>
          <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{replyMessage.text}</div>
        </div>
      ) : null}
      <div className="chat-room-input-box flex items-center space-x-4 h-[32px] box-border px-4 border-0 border-b border-solid border-[#2E2E2E]">
        <ChatInputTool
          onSelectEmoji={onToolSelectEmoji}
          onImageUpload={onToolImageUpload}
          onDollarClick={onDollarClick}
          me={props.me}
        />
      </div>
      <div className="flex-1 overflow-y-auto box-border p-1 relative">
        {
          props.channelReady ? (
            <>
              <EditorContent className="h-full px-2 box-border" editor={editor} />
              {!editor?.isEditable ? (
                props.inChannel ? (
                  <div className="absolute inset-0 flex items-center justify-center left-0 right-0 top-0 bottom-0 box-border">
                    {
                      !canInput ? (
                        <div className="text-tertiary text-base">管理员已限制当前群组的发言</div>
                      ) : (
                        <div className="text-tertiary text-base">您已被禁言</div>
                      )
                    }
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center left-0 right-0 top-0 bottom-0 box-border">
                    <div className="text-tertiary text-base">已不在该社群中</div>
                  </div>
                )
              ) : null}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center left-0 right-0 top-0 bottom-0 box-border">
            </div>
          )
        }

      </div>
    </div>
  )
})

interface ChatInputToolProps {
  onSelectEmoji: (emoji: string) => void
  onImageUpload: (fileUrl: string, name: string) => void
  onDollarClick: () => void
  me?: ChatSubscriber
}

const ChatInputTool = ({ onSelectEmoji, onImageUpload, me }: ChatInputToolProps) => {
  const teacher = useUser(s => s.user?.teacher)
  return (
    <div className="chat-room-input-box flex items-center space-x-4 h-[32px] box-border">
      <EmojiPicker onPicker={onSelectEmoji}>
        <div className="flex items-center justify-center cursor-pointer text-tertiary">
          <JknIcon.Svg name="emoji" size={20} />
        </div>
      </EmojiPicker>
      <div className="flex items-center justify-center cursor-pointer text-tertiary">
        <ImagePicker onUpload={onImageUpload}>
          <JknIcon.Svg name="picture" size={20} />
        </ImagePicker>
      </div>
      {/* <div
        className="flex items-center justify-center cursor-pointer text-tertiary "
        onClick={onDollarClick}
        onKeyDown={() => { }}
      >
        <JknIcon.Svg name="dollar" size={20} />
      </div> */}
      {
        teacher || me?.isManager || me?.isOwner ? (
          <div className="flex items-center justify-center cursor-pointer text-tertiary pt-1">
            <VoteInput>
              <JknIcon.Svg name="rank" size={18} />
            </VoteInput>
          </div>
        ) : null
      }
    </div>
  )
}

interface EmojiPicker {
  onPicker: (emoji: string) => void
}

const EmojiPicker = ({ children, onPicker }: PropsWithChildren<EmojiPicker>) => {
  const [visible, setVisible] = useState(false)

  return (
    <Popover open={visible} onOpenChange={setVisible}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-fit">
        <Picker
          theme="dark"
          previewPosition="none"
          searchPosition="none"
          data={emojiData}
          onEmojiSelect={(emoji: any) => {
            onPicker(emoji.native)
            setVisible(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

interface ImagePickerProps {
  onUpload: (fileUrl: string, name: string) => void
}

const ImagePicker = ({ onUpload, children }: PropsWithChildren<ImagePickerProps>) => {
  const inputId = useId()
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    e.target.files = null
    e.target.value = ''

    const url = URL.createObjectURL(file)

    onUpload(url, file.name)
  }

  return (
    <div className="flex items-center">
      <input id={inputId} type="file" accept="image/*" onInput={handleFileChange} hidden />
      <label htmlFor={inputId} className="cursor-pointer mt-1">
        {children}
      </label>
    </div>
  )
}


// 投票
export const VoteInput = ({ children }: PropsWithChildren) => {
  const channel = useChatStore(s => s.channel)
  if (!channel) return children
  return (
    <JknModal lazy trigger={children} title="投票"
      footer={null}
    >
      {
        ({ close }) => <VoteForm
          channel={channel}
          onClose={close}
          onSubmit={close}
        />
      }
    </JknModal>
  )
}
