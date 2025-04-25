
import AssetsTop from '../components/top';
import AssetsInfo from '../components/info';
import { MenuInline } from "@/components";
import { useChart } from "@/hooks";
import { useEffect, useState } from "react";
import { getLineChartOps, getBarChartOps } from '../const'
import { useDebounce } from 'ahooks'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    JknIcon,
} from '@/components'

const CurvReport = () => {
    const [chart, dom] = useChart()
    const [selectedKey, setSelectedKey] = useState('YKQX')
    const [resizeTrigger, setResizeTrigger] = useState(0)
    const debouncedResizeTrigger = useDebounce(resizeTrigger, 500)

    const tabs = [
        { key: 'YKQX', label: `盈亏曲线`, getOps: getLineChartOps },
        { key: 'GGKZZT', label: `个股盈亏柱状图`, getOps: getBarChartOps },
    ]

    useEffect(() => {
        if (!chart.current) return
        const options = tabs.find(tab => tab.key == selectedKey)?.getOps()
        options && chart.current.setOption(options)

        const handleResize = () => {
            setResizeTrigger((prev) => prev + 1)
        };
        window.addEventListener("resize", handleResize);

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
        const ops = tabs.find(tab => tab.key == key)?.getOps()
        ops && chart.current?.setOption(ops)
    }

    return <div className='mt-5 flex flex-1 border-[1px] border-solid border-[#3c3c3c] rounded-md w-full h-full p-6 box-border flex flex-col'>
        <div className="px-3 py-2.5">
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
        </div>
        <div ref={dom} className="w-full h-full"></div>
    </div>

}

export default CurvReport