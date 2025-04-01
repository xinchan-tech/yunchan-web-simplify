
import { Input } from "@/components"
import { cn } from "@/utils/style"
import { forwardRef } from "react"

interface NameInputProps {
  value?: string
  onChange?: (value: string) => void
}
export const NameInput = forwardRef((props: NameInputProps, _) => {
  return (
    <div className="ml-auto flex-1">
      <Input value={props.value} onChange={e => props.onChange?.(e.target.value)} placeholder="+添加自定义名称"
        className={cn(
          'border-none rounded-xs placeholder:text-tertiary text-base text-right h-10 box-border',
          'focus:!outline-3 focus:!outline-primary'
        )}
      />
    </div>
  )
})
