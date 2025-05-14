import { useChart } from "@/hooks";
import { useEffect, useState, useMemo } from "react";
import { getLineChartOps, getBarChartOps } from '../const'
import { useDebounce } from 'ahooks'
import { useQuery } from '@tanstack/react-query'
import { getStockInvestProfit } from '@/api'
import { cn } from '@/utils/style'
import { useAssetsInfoStore } from '@/store/chat'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    JknIcon,
    JknRangePicker
} from '@/components'
type XArrType = string[]
type YArrType = number[]
const CurvReport = () => {
    const [chart, dom] = useChart()
    const [chart2, dom2] = useChart()
    const [selectedKey, setSelectedKey] = useState('YKQX')
    const [resizeTrigger, setResizeTrigger] = useState(0)
    const debouncedResizeTrigger = useDebounce(resizeTrigger, 500)
    const [start_time, setStarTime] = useState<string>()
    const [end_time, setEndTime] = useState<string>()
    const dateValue = useMemo(() => {
        return start_time && end_time ? [start_time, end_time] : []
    }, [start_time, end_time])


    const query = useQuery({
        queryKey: [getStockInvestProfit.cacheKey, start_time, end_time],
        queryFn: () =>
            getStockInvestProfit({ type: 1, end_time, start_time }),
    })


    const tabs = [
        { key: 'YKQX', label: `盈亏曲线`, getOps: getLineChartOps },
        { key: 'GGKZZT', label: `个股盈亏柱状图`, getOps: getBarChartOps },
    ]

    const getEchartData = (data = []) => {
        const info = useAssetsInfoStore?.getState()?.data || {}
        if (!data.length) return { xArr: [], yArr: [] }
        const xArr: XArrType = []
        const yArr: YArrType = []
        data.forEach(v => {
            yArr.push(v.value)
            xArr.push(v.name)
        })
        return { xArr, yArr, cost: info.cost }
    }

    useEffect(() => {
        const { status, data } = query.data || {}
        if (status == 1) {
            if (selectedKey == 'YKQX') {
                const { xArr, yArr, cost } = getEchartData(data)
                const options = tabs.find(tab => tab.key == selectedKey)?.getOps(cost, { xArr, yArr })
                options && chart?.current.setOption(options)
            }
        }
    }, [query.data])



    useEffect(() => {
        let handleResize = null
        if (chart.current) {
            const { xArr, yArr, cost } = getEchartData(query?.data?.data)
            const options = getLineChartOps(cost, { xArr, yArr })
            options && chart.current.setOption(options)

            handleResize = () => {
                setResizeTrigger((prev) => prev + 1)
            };
            window.addEventListener("resize", handleResize);
        }
        if (chart2.current) {
            const options = getBarChartOps()
            options && chart2.current.setOption(options)
        }

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.current?.dispose();
        };
    }, [])

    useEffect(() => {
        if (debouncedResizeTrigger > 0) {
            chart.current?.resize();
        }
    }, [debouncedResizeTrigger])

    const onTypeChange = (key: string) => {
        setSelectedKey(key)
        setStarTime('')
        setEndTime('')
    }

    const onDateChange = (start: string, end: string) => {
        console.log(start, end, 9999)
        setStarTime(start)
        setEndTime(end)
    }

    return <div className='flex flex-1 bg-[#1A191B] rounded-[2rem] w-full h-full p-6 box-border flex flex-col'>
        <div className="px-3 py-2.5 flex justify-between">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="flex justify-between px-5 py-2.5 box-border border-[1px] w-[10rem] border-solid border-[#3c3c3c] rounded-md items-center space-x-2 text-lg font-bold">
                        <span className='text-[#DBDBDB] text-sm'>{tabs.find(tab => tab.key == selectedKey)?.label}</span>
                        <JknIcon.Svg name="arrow-down" size={10} />
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent style={{ width: '10rem' }}>
                    {tabs.filter(tab => tab.key != selectedKey).map(tab => (
                        <DropdownMenuItem key={tab.key} onClick={() => onTypeChange(tab.key as string)} >
                            {tab.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center justify-end mr-6">
                <JknRangePicker value={dateValue} allowClear onChange={onDateChange} placeholder={["开始时间", "截止时间"]} />
            </div>
        </div>

        <div ref={dom} className={cn("w-full h-full", selectedKey !== 'YKQX' ? 'hidden' : '')}></div>
        <div ref={dom2} className={cn("w-full h-full", selectedKey == 'YKQX' ? 'hidden' : '')}></div>

    </div>

}

export default CurvReport