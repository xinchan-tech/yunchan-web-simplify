import { useState, type ReactNode } from 'react';
import 'react-day-picker/dist/style.css';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { DayPickerRangeProps, DateRange } from 'react-day-picker'
import { JknIcon, Input } from '@/components'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/utils/style'
import dayjs from 'dayjs';
import { useBoolean } from 'ahooks'
interface DatePickerPropsBase {
    placeholder?: string[]
    allowClear?: Boolean
    onChange?: (start: string, end: string) => void
    onClose?: (start: string, end: string) => void
    children?: ReactNode | ((date: string | undefined, action: { open: () => void; close: () => void }) => ReactNode)
}

/**
 * * @description 日期范围选择器
 * * @param {string[]} placeholder - 占位符数组，分别对应开始和结束日期的占位符
 * * @param {function} onChange - 日期范围变化时的回调函数，接收开始和结束日期的字符串参数
 * * @param {function} onClose - 清除按钮点击时的回调函数
 * * 
 * 
 *  hover 颜色不好看
 */
type JknDatePickerProps = Omit<DayPickerRangeProps, 'mode'> & DatePickerPropsBase
const JknRangePicker = ({ children, onChange, onClose, allowClear, placeholder, classNames, ...props }: JknDatePickerProps) => {
    const [range, setRange] = useState<{ from?: Date; to?: Date }>({}); // 共享的日期范围
    const [open, { setTrue, setFalse }] = useBoolean(false)
    const [leftMonth, setLeftMonth] = useState<Date>(new Date()); // 左边选择器的月份
    const [rightMonth, setRightMonth] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() + 1))); // 右边选择器的月份
    const [date, setDate] = useState<string[]>([])
    const [isOPen, { setTrue: setOpen, setFalse: setClose }] = useBoolean(false); // 控制图标切换
    const [hovered, setHovered] = useState(false); // 控制图标切换

    const handleDateChange = (newRange: DateRange | undefined, from: Date) => {
        // 如果选择完成（有开始和结束日期），清除上次选择并设置新范围
        if (newRange?.from && newRange?.to && !isOPen) {
            const startDate = dayjs(newRange.from).format('YYYY-MM-DD'); // 使用 dayjs 格式化开始日期
            const endDate = dayjs(newRange.to).format('YYYY-MM-DD'); // 使用 dayjs 格式化结束日期
            setRange(newRange); // 更新选择范围
            onChange && onChange(startDate, endDate)  // 触发回调
            setFalse()
            setDate([startDate, endDate])
            setOpen()
        } else if (newRange) {
            setRange({ from }); // 更新选择范围
            setClose()
        }
    };


    const handleLeftMonthChange = (month: Date) => {
        setLeftMonth(month);
        setRightMonth(new Date(month.getFullYear(), month.getMonth() + 1)); // 右边月份始终比左边多一个月
    };

    const handleRightMonthChange = (month: Date) => {
        setRightMonth(month);
        setLeftMonth(new Date(month.getFullYear(), month.getMonth() - 1)); // 左边月份始终比右边少一个月
    };


    const close = (e: React.MouseEvent): void => { // 关闭弹窗时的处理函数
        e.stopPropagation(); // 阻止事件冒泡
        setFalse(); // 关闭弹窗
        setRange({}); // 清除选择范围
        setDate([]); // 清除日期
        onClose && onClose('', '') // 触发回调
        onChange && onChange('', '') // 触发回调
    };

    return <Popover open={open} onOpenChange={show => (show ? setTrue() : setFalse())}>
        <PopoverTrigger asChild>
            <div className='w-[25rem] flex items-center cursor-pointer border-[1px] pr-4 box-border  border-solid border-[#3c3c3c] rounded-lg box-border text-[#B8B8B8] text-base'>

                <Input className='pl-7 border-0 focus:order-0 flex-1 placeholder:text-[#808080]' readOnly placeholder={(placeholder?.[0] ?? "开始日期")} value={date[0] || ''} onClick={open ? setFalse : setTrue} />
                -
                <Input className='border-0 flex-1 placeholder:text-[#808080]' readOnly placeholder={(placeholder?.[1] ?? "结束日期")} value={date[1] || ''} onClick={open ? setFalse : setTrue} />
                {/* {
                    date.length && allowClear ? */}
                <div className={cn('flex justify-center items-center border-[1px]  w-[1.2rem] h-[1.2rem] border-solid border-[#0f0f0f] mx-2 rounded-full',
                    hovered && 'hover:border-[#3c3c3c]',
                )}
                    onMouseEnter={() => setHovered(true)} // 鼠标移入时切换图标
                    onMouseLeave={() => setHovered(false)} // 鼠标移出时恢复图标
                    onClick={close}>
                    {hovered && date.length && allowClear ?
                        <JknIcon.Svg name="close" size={12} />
                        :
                        <JknIcon.Svg name="date-icon" size={24} onClick={close} />
                    }
                </div>
            </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-auto h-[432]">
            <div className="flex space-x-4 bg-popover">
                {/* 左边日期选择器 */}
                <div>
                    <Calendar
                        mode="range"
                        selected={range}
                        onSelect={handleDateChange}
                        month={leftMonth} // 左边选择器的当前月份
                        onMonthChange={handleLeftMonthChange} // 更新左边月份
                        classNames={{
                            nav_button_next: 'hidden ', // 隐藏下个月按钮
                            // day: cn(
                            //     buttonVariants({ variant: 'default', reset: true }),
                            //     'h-8 w-8 p-0 font-normal aria-selected:bg-zinc-300'
                            //   ),
                            ...classNames
                        }}
                        // className='hover:bg-blue-700'
                        {...props}
                    />
                </div>

                {/* 右边日期选择器 */}
                <div>
                    <Calendar
                        mode="range"
                        selected={range}
                        onSelect={handleDateChange}
                        month={rightMonth} // 右边选择器的当前月份
                        onMonthChange={handleRightMonthChange} // 更新右边月份
                        classNames={{
                            nav_button_previous: 'hidden', // 隐藏上个月按钮
                            ...classNames
                        }}
                        {...props}
                    />
                </div>
            </div>
        </PopoverContent>
    </Popover>
};

export default JknRangePicker;