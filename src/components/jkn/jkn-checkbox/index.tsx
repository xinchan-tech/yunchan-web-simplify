import type { ComponentProps } from "react"
import JknIcon from "../jkn-icon"
import { cn } from "@/utils/style"

interface JknCheckboxProps extends ComponentProps<typeof JknIcon.Checkbox> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export const JknCheckbox = ({ checked, onCheckedChange, className, ...props }: JknCheckboxProps) => {
  return (
    <JknIcon.Checkbox className={cn('w-4 h-4 rounded-none', className)} uncheckedIcon="checkbox_mult_nor" checkedIcon="checkbox_mult_sel" checked={checked} onClick={() => onCheckedChange?.(!checked)} {...props} />
  )
}