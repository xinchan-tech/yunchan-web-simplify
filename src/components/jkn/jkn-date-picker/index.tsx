import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useBoolean, useMount } from 'ahooks'
import dayjs from 'dayjs'
import { type ReactNode, useRef } from 'react'
import type { DayPickerSingleProps } from 'react-day-picker'
import { JknIcon } from "../jkn-icon"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { usePropValue } from "@/hooks"

interface DatePickerPropsBase {
  onChange?: (date?: string) => void
  children: ReactNode | ((date: string | undefined, action: { open: () => void; close: () => void }) => ReactNode)
  time?: boolean
  date?: string
}

type JknDatePickerProps = Omit<DayPickerSingleProps, 'mode'> & DatePickerPropsBase

function JknDatePicker({ children, onChange, date: _date, time, ...props }: JknDatePickerProps) {
  const [date, setDate] = usePropValue<string>(_date)
  const [open, { setTrue, setFalse }] = useBoolean(false)
  const format = time ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'

  const _onSelect = (d?: Date) => {
    const oldDate = dayjs(date || Date.now())
    console.log(d, oldDate, date)
    if (d) {
      let newDate = dayjs(d)
      if (time) {
        newDate = newDate.set('hour', oldDate.hour()).set('minute', oldDate.minute())
      }
      setDate(newDate.format(format))
      onChange?.(newDate.format(format))
    } else {
      setDate(undefined)
      onChange?.(undefined)
    }
    setFalse()
  }

  const onChangeTime = (d?: Date) => {

    if (d) {
      setDate(dayjs(d).format(format))
      onChange?.(dayjs(d).format(format))
    } else {
      setDate(undefined)
      onChange?.(undefined)
    }
  }



  return (
    <Popover open={open} onOpenChange={show => (show ? setTrue() : setFalse())}>
      <PopoverTrigger asChild>
        {typeof children === 'function' ? children(date, { open: setTrue, close: setFalse }) : children}
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[360px]" style={{ height: 432 + (time ? 42 : 0) }}>
        <Calendar mode="single" selected={dayjs(date || Date.now()).toDate()} onDayClick={_onSelect} {...props} />
        {
          time ? (
            <div className="flex items-center justify-between px-4">
              <div className="text-secondary">选择时间：</div>
              <TimePicker value={date || Date.now() as any} onChange={onChangeTime} />
            </div>
          ) : null
        }
      </PopoverContent>
    </Popover>
  )
}

interface TimePickerProps {
  onChange?: (date?: Date) => void
  value?: string
}

const TimePicker = ({ onChange, value }: TimePickerProps) => {
  const [open, { setTrue, setFalse }] = useBoolean(false)
  const onChangeMin = (min: number) => {
    const date = dayjs(value).set('minute', min)
    onChange?.(date.toDate())
  }

  const onChangeHour = (hour: number) => {
    const date = dayjs(value).set('hour', hour)
    onChange?.(date.toDate())
  }

  return (
    <Popover open={open} onOpenChange={show => (show ? setTrue() : setFalse())} modal >
      <PopoverTrigger asChild>
        <div className="inline-flex items-center p-2 rounded hover:bg-accent cursor-pointer">
          <div>{dayjs(value).format('HH:mm')}</div>&nbsp;
          <JknIcon.Svg name="calendar-2" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-fit">
        {
          open ? (
            <div className="flex items-start">
              <NumberScrollPicker rangeStart={0} rangeEnd={23} onChange={onChangeHour} value={dayjs(value).hour()} />
              <Separator orientation="vertical" className="mx-1 h-[320px] bg-accent w-[1px]" />
              <NumberScrollPicker rangeStart={0} rangeEnd={59} onChange={onChangeMin} value={dayjs(value).minute()} />
            </div>
          ) : null
        }
      </PopoverContent>
    </Popover>
  )
}

interface NumberScrollPickerProps {
  rangeStart: number
  rangeEnd: number
  onChange?: (value: number) => void
  value?: number
}
const NumberScrollPicker = ({ rangeStart, rangeEnd, onChange, value }: NumberScrollPickerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  useMount(() => {
    if (scrollRef.current) {
      const offset = (value ?? 0) * 32 - 3 * 32
      scrollRef.current.querySelector('.scroll-area-viewport[data-radix-scroll-area-viewport]')?.scrollTo({
        top: offset
      })
    }
  })

  return (
    <ScrollArea className="h-[320px]" ref={scrollRef}>
      <div className="flex flex-col items-center justify-center px-1">
        {
          Array.from({ length: rangeEnd - rangeStart + 1 }, (_, i) => i + rangeStart).map((item) => (
            <div key={item} className="h-8 w-10 flex items-center rounded hover:bg-foreground hover:text-background cursor-pointer justify-center data-[checked=true]:bg-foreground data-[checked=true]:text-background" data-checked={item === value}
              onClick={() => {
                onChange?.(item)
              }}
              onKeyDown={() => { }}
            >
              <div className="text-sm">{item}</div>
            </div>
          ))
        }
      </div>
    </ScrollArea>
  )
}


export default JknDatePicker
