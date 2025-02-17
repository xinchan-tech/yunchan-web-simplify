import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useBoolean } from 'ahooks'
import dayjs from 'dayjs'
import { type ReactNode, useState } from 'react'
import type { DayPickerSingleProps } from 'react-day-picker'

interface DatePickerPropsBase {
  onChange?: (date?: string) => void
  children: ReactNode | ((date: string | undefined, action: { open: () => void; close: () => void }) => ReactNode)
}

type JknDatePickerProps = Omit<DayPickerSingleProps, 'mode'> & DatePickerPropsBase

function JknDatePicker({ children, onChange, ...props }: JknDatePickerProps) {
  const [date, setDate] = useState<string>()
  const [open, { setTrue, setFalse }] = useBoolean(false)

  const _onSelect = (d?: Date) => {
    if (d) {
      setDate(dayjs(d).format('YYYY-MM-DD'))
      onChange?.(dayjs(d).format('YYYY-MM-DD'))
    } else {
      setDate(undefined)
      onChange?.(undefined)
    }
    setFalse()
  }

  return (
    <Popover open={open} onOpenChange={show => (show ? setTrue() : setFalse())}>
      <PopoverTrigger asChild>
        {typeof children === 'function' ? children(date, { open: setTrue, close: setFalse }) : children}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={dayjs(date).toDate()} onSelect={_onSelect} {...props} />
      </PopoverContent>
    </Popover>
  )
}

export default JknDatePicker
