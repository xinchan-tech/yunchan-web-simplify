import { Input, JknDatePicker, JknIcon } from '@/components'
import { cn } from '@/utils/style'
import { forwardRef } from 'react'

interface DatePickerProps {
  value?: string
  onChange?: (value?: string) => void
}
export const DatePicker = forwardRef((props: DatePickerProps, _) => {
  return (
    <div className="ml-auto flex-1">
      <JknDatePicker onChange={v => props.onChange?.(v)}>
        {v => (
          <div className="rounded-xs px-3 py-1 text-base cursor-pointer flex items-center justify-end text-tertiary">
            {v ?? '选择日期'}&nbsp;
            <JknIcon.Svg name="arrow-down" className="" size={10} />
          </div>
        )}
      </JknDatePicker>
    </div>
  )
})
