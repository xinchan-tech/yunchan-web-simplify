import { JknIcon, PopoverContent, PopoverTrigger, Textarea } from "@/components"
import { Popover } from "@radix-ui/react-popover"
import { forwardRef, type KeyboardEventHandler, type PropsWithChildren, useId, useImperativeHandle, useRef, useState } from "react"
import Picker from '@emoji-mart/react'
import emojiData from '@emoji-mart/data'
import { uploadUtils } from "@/utils/oss"

interface ChatInputProps {
  channelId?: string
  onSubmit?: (text: string) => void

}

interface ChatInputInstance {
  setInput: (str: string) => void
}



export const ChatInput = forwardRef<ChatInputInstance, ChatInputProps>((props, ref) => {
  const [inputText, setInputText] = useState('')
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  useImperativeHandle(ref, () => ({
    setInput: (str: string) => {
      setInputText(str)
    }
  }))

  const onKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.ctrlKey) {
        setInputText(`${inputText}\n`)
        return
      }

      props.onSubmit?.(inputText)
      setInputText('')
    }

    return
  }

  const onToolSelectEmoji = (e: string) => {
    setInputText(`${inputText}${e}`)
  }

  const onDollarClick = () => {

  }

  const onToolImageUpload = (fileUrl: string) => {

  }


  return (
    <div className="chat-room-input h-[180px]">
      <div className="chat-room-input-box flex items-center space-x-4 h-[32px] box-border px-4 border-b-primary">
        <ChatInputTool onSelectEmoji={onToolSelectEmoji} onImageUpload={onToolImageUpload} onDollarClick={onDollarClick} />
      </div>
      <div className="h-[148px] text-sm">
        <Textarea
          className="w-full box-border h-full border-none placeholder:text-tertiary text-secondary outline-none shadow-none focus-within:border-none !focus-visible:border-none focus-visible:!shadow-none"
          value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="在这里，分享您的观点"
          onKeyDown={onKeyDown}
          ref={textAreaRef}
        />
      </div>
    </div>
  )

})

interface ChatInputToolProps {
  onSelectEmoji: (emoji: string) => void
  onImageUpload: (fileUrl: string) => void
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
  onUpload: (fileUrl: string) => void
}

const ImagePicker = ({ onUpload, children }: PropsWithChildren<ImagePickerProps>) => {
  const inputId = useId()
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    uploadUtils.upload(file, file.name).then((res) => {
      onUpload(res.url)
    })
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
