import type { Message, SystemContent } from 'wukongimjssdk'

interface SystemTextRecordProps {
  message: Message
}

export const SystemRecord = ({ message }: SystemTextRecordProps) => {
  const content = message.content as SystemContent

  return <div className="text-center text-xs text-tertiary my-2.5">{content.content.content}</div>
}
