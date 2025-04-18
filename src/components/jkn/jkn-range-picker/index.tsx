import { useState, type ReactNode } from 'react';
import 'react-day-picker/dist/style.css';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { DayPickerRangeProps, DateRange } from 'react-day-picker'
import { JknIcon, Input } from '@/components'
import dayjs from 'dayjs';
import { useBoolean } from 'ahooks'
interface DatePickerPropsBase {
    placeholder?: string[]
    onChange?: (start: string, end: string) => void
    children?: ReactNode | ((date: string | undefined, action: { open: () => void; close: () => void }) => ReactNode)
}

/**
 * * @description 日期范围选择器
 * * @param {string[]} placeholder - 占位符数组，分别对应开始和结束日期的占位符
 * * @param {function} onChange - 日期范围变化时的回调函数，接收开始和结束日期的字符串参数
 * 
 *  补充功能 placeholder 字体颜色没有修改
 *  hover 颜色不好看
 *  背景颜色没有修改 补充一些额外的参数 className  allowClear 清除按钮等
 *  选择之后再次打开，应该时保留上一次选择的日期，再次选择才会清除，目前关闭直接清除
 */
type JknDatePickerProps = Omit<DayPickerRangeProps, 'mode'> & DatePickerPropsBase
const JknRangePicker = ({ children, onChange, placeholder, ...props }: JknDatePickerProps) => {
    const [range, setRange] = useState<{ from?: Date; to?: Date }>({}); // 共享的日期范围
    const [open, { setTrue, setFalse }] = useBoolean(false)
    const [leftMonth, setLeftMonth] = useState<Date>(new Date()); // 左边选择器的月份
    const [rightMonth, setRightMonth] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() + 1))); // 右边选择器的月份
    const [date, setDate] = useState<string[]>([])

    const handleDateChange = (newRange: DateRange | undefined) => {
        console.log('newRange', newRange)
        // 如果选择完成（有开始和结束日期），清除上次选择并设置新范围
        if (newRange?.from && newRange?.to) {
            const startDate = dayjs(newRange.from).format('YYYY-MM-DD'); // 使用 dayjs 格式化开始日期
            const endDate = dayjs(newRange.to).format('YYYY-MM-DD'); // 使用 dayjs 格式化结束日期
            setRange(newRange); // 更新选择范围
            onChange && onChange(startDate, endDate)  // 触发回调
            setFalse()
            setDate([startDate, endDate])
            setRange({})
        } else if (newRange) {
            setRange(newRange); // 更新选择范围
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

    return <Popover open={open} onOpenChange={show => (show ? setTrue() : setFalse())}>
        <PopoverTrigger asChild>
            <div className='w-[25rem] flex items-center cursor-pointer border-[1px]  border-solid border-[#3c3c3c] rounded-lg box-border text-[#B8B8B8] text-base'>
                <JknIcon.Svg name="date-icon" size={24} className='w-[1.5rem] ml-4' />
                <Input className='pl-7 border-0 focus:order-0 flex-1 ::placeholder:text-[#808080]' readOnly  placeholder={(placeholder?.[0] ?? "开始日期")} value={date[0] || ''} onClick={open ? setFalse : setTrue} />
                -
                <Input className='border-0 flex-1 ::placeholder:text-[#808080]' readOnly  placeholder={(placeholder?.[1] ?? "结束日期")} value={date[1] || ''} onClick={open ? setFalse : setTrue} />
            </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-auto h-[432]">
            <div className="flex space-x-4 bg-popover">
                {/* 左边日期选择器 */}
                <div>
                    <Calendar
                        mode="range"
                        selected={range.from && range.to ? { from: range.from, to: range.to } : undefined}
                        onSelect={handleDateChange}
                        month={leftMonth} // 左边选择器的当前月份
                        onMonthChange={handleLeftMonthChange} // 更新左边月份
                        classNames={{
                            day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground bg-blue-500 text-white', // 点击日期的颜色
                            day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground bg-blue-200 text-blue-600', // 选择区间的颜色
                            nav_button_next: 'hidden ', // 隐藏下个月按钮
                        }}
                        {...props}
                    />
                </div>

                {/* 右边日期选择器 */}
                <div>
                    <Calendar
                        mode="range"
                        selected={range.from && range.to ? { from: range.from, to: range.to } : undefined}
                        onSelect={handleDateChange}
                        month={rightMonth} // 右边选择器的当前月份
                        onMonthChange={handleRightMonthChange} // 更新右边月份
                        classNames={{
                            day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground bg-blue-500 text-white', // 点击日期的颜色
                            day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground bg-blue-200 text-blue-600', // 选择区间的颜色
                            nav_button_previous: 'hidden', // 隐藏上个月按钮
                            nav_button_next: 'absolute right-1', // 保留下个月按钮
                        }}
                        {...props}
                    />
                </div>
            </div>
        </PopoverContent>
    </Popover>
};

export default JknRangePicker;