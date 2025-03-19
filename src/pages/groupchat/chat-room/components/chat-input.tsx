import { JknIcon, PopoverContent, PopoverTrigger } from "@/components"
import { Popover } from "@radix-ui/react-popover"
import { forwardRef, type PropsWithChildren, useCallback, useEffect, useId, useImperativeHandle, useState } from "react"
import Picker from '@emoji-mart/react'
import emojiData from '@emoji-mart/data'
import { useEditor, EditorContent, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { type ChatEvent, chatEvent } from "../../lib/event"
import { useImmer } from "use-immer"
import { isMessageText } from "../../lib/model"
import { ChatCmdType, ChatMessageType } from "@/store"
import { useCMDListener, useSubscribesListener } from "../../lib/hooks"
import { WKSDK, type Channel, type CMDContent } from "wukongimjssdk"
import { hasForbidden } from "../../lib/utils"

interface ChatInputProps {
  channel?: Channel
  onSubmit?: (text?: JSONContent, mentions?: string[]) => void
}

interface ChatInputInstance {
  setInput: (str: string) => void
}

const extensions = [StarterKit, Image]

export const ChatInput = forwardRef<ChatInputInstance, ChatInputProps>((props, ref) => {
  const [mentionList, setMentionList] = useImmer<{ name: string; uid: string }[]>([])
  const [replyMessage, setReplyMessage] = useImmer<Nullable<{ name: string; text: string }>>(null)

  const editor = useEditor({
    extensions,
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
    props.onSubmit?.(content, mentionList.map(item => item.uid))
    setMentionList([])
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
    const mentionHandler = ({ userInfo, channelId }: ChatEvent['mentionUser']) => {
      if (!editor?.isEditable) return false
      if (channelId !== props.channel?.channelID) return
      setReplyMessage(null)
      setMentionList(draft => {
        if (draft.some(item => item.uid === userInfo.uid)) return

        draft.push(userInfo)
      })
    }
    chatEvent.on('mentionUser', mentionHandler)

    const copyHandler = ({ channelId, message }: ChatEvent['copyMessage']) => {
      if (!editor?.isEditable) return false
      if (channelId !== props.channel?.channelID) return

      if (message.contentType === ChatMessageType.Text) {
        editor?.commands.insertContent(message.content.text)
      } else if (message.contentType === ChatMessageType.Image) {
        editor?.commands.setImage({ src: message.content.remoteUrl })
      }

      editor?.commands.focus()
    }
    chatEvent.on('copyMessage', copyHandler)

    const replayHandler = ({ channelId, message, fromName }: ChatEvent['replyMessage']) => {
      if (!editor?.isEditable) return false
      if (channelId !== props.channel?.channelID) return

      setMentionList([])

      if (message.contentType === ChatMessageType.Text) {
        setReplyMessage({ name: fromName, text: message.content.text })
      } else if (message.contentType === ChatMessageType.Image) {
        setReplyMessage({ name: fromName, text: '[图片]' })
      }

      editor?.commands.focus()
    }
    chatEvent.on('replyMessage', replayHandler)

    return () => {
      chatEvent.off('mentionUser', mentionHandler)
      chatEvent.off('copyMessage', copyHandler)
      chatEvent.off('replyMessage', replayHandler)
      setMentionList([])
    }
  }, [props.channel?.channelID, setMentionList, editor, setReplyMessage])

  useSubscribesListener(props.channel, useCallback((channel) => {
    if (!props.channel!.isEqual(channel)) return
    const me = WKSDK.shared().channelManager.getSubscribeOfMe(channel)

    if (!me || hasForbidden(me)) {
      editor?.commands.clearContent()
      editor?.setEditable(false)
    } else {
      editor?.setEditable(true)

    }
  }, [props.channel, editor]))


  useEffect(() => {
    editor?.commands.clearContent()
  }, [editor])

  return (
    <div className="chat-room-input h-[180px] relative">
      {
        mentionList.length ? (
          <div className="flex items-center absolute text-sm left-0 -top-8 h-8 box-border px-3 leading-8 border-t-primary right-0 bg-[#0a0a0a]">
            <JknIcon.Svg name="close" className="cursor-pointer" size={12} onClick={() => setMentionList([])} />
            <span>&nbsp;&nbsp;回复用户: &nbsp;&nbsp;</span>
            <div className="flex items-center space-x-4" >
              {
                mentionList.map(item => (
                  <span key={item.uid}>@{item.name}</span>
                ))
              }
            </div>
          </div>
        ) : null
      }
      {
        replyMessage ? (
          <div className="flex items-center absolute text-sm left-0 -top-8 h-8 box-border px-3 leading-8 border-t-primary right-0 bg-[#0a0a0a]">
            <JknIcon.Svg name="close" className="cursor-pointer" size={12} onClick={() => setMentionList([])} />
            <span>&nbsp;&nbsp;{replyMessage.name}: &nbsp;&nbsp;</span>
            <div className="flex items-center space-x-4" >
              {replyMessage.text}
            </div>
          </div>
        ) : null
      }
      <div className="chat-room-input-box flex items-center space-x-4 h-[32px] box-border px-4 border-b-primary">
        <ChatInputTool onSelectEmoji={onToolSelectEmoji} onImageUpload={onToolImageUpload} onDollarClick={onDollarClick} />
      </div>
      <div className="h-[148px] overflow-y-auto box-border p-1 relative ">
        <EditorContent className="h-[140px] px-2 box-border" editor={editor} />
        {
          !editor?.isEditable ? (
            <div className="absolute inset-0 flex items-center justify-center left-0 right-0 top-0 bottom-0 box-border">
              <div className="text-tertiary text-base">您已被禁言</div>
            </div>
          ) : null
        }
      </div>
    </div>
  )
})

interface ChatInputToolProps {
  onSelectEmoji: (emoji: string) => void
  onImageUpload: (fileUrl: string, name: string) => void
  onDollarClick: () => void
}

const ChatInputTool = ({ onSelectEmoji, onImageUpload, onDollarClick }: ChatInputToolProps) => {
  return (
    <div className="chat-room-input-box flex items-center space-x-4 h-[32px] box-border border-b-primary">
      <EmojiPicker onPicker={onSelectEmoji}>
        <div className="flex items-center justify-center cursor-pointer text-tertiary"><JknIcon.Svg name="emoji" size={20} /></div>
      </EmojiPicker>
      <div className="flex items-center justify-center cursor-pointer text-tertiary">
        <ImagePicker onUpload={onImageUpload}>
          <JknIcon.Svg name="picture" size={20} />
        </ImagePicker>
      </div>
      <div className="flex items-center justify-center cursor-pointer text-tertiary " onClick={onDollarClick} onKeyDown={() => { }}>
        <JknIcon.Svg name="dollar" size={20} />
      </div>
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
          }} />
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

    const url = URL.createObjectURL(file)

    onUpload(url, file.name)
  }

  return (
    <div className="flex items-center">
      <input id={inputId} type="file" accept="image/*" onChange={handleFileChange} hidden />
      <label htmlFor={inputId} className="cursor-pointer mt-1">
        {children}
      </label>
    </div>
  )
}
