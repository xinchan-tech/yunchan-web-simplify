import { type ComponentPropsWithoutRef, type ReactNode, useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import dayjs from "dayjs"
import { useBoolean } from "ahooks"

interface DatePickerProps extends Omit<ComponentPropsWithoutRef<"div">, 'onChange' | 'children'> {
  onChange?: (date?: string) => void
  children: ReactNode | ((date: string | undefined, action: { open: () => void, close: () => void }) => ReactNode)
}
function JknDatePicker({ children, onChange, ...props }: DatePickerProps) {
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
  }

  return (
    <Popover open={open} onOpenChange={show => show ? setTrue() : setFalse()}>
      <PopoverTrigger asChild>
        {
          typeof children === 'function' ?
            children(date, { open: setTrue, close: setFalse }) :
            children
        }
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={dayjs(date).toDate()}
          onSelect={_onSelect}
        />
      </PopoverContent>
    </Popover>
  )
}

export default JknDatePicker