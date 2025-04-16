import imageLogo from "@/assets/image/logo.png";
import { useChart } from "@/hooks";
import { useEffect, useState } from "react";
import { getChartOps } from './const'
import { useDebounce } from 'ahooks'

const ReportCurv = () => {
  const [chart, dom] = useChart()
  const [resizeTrigger, setResizeTrigger] = useState(0)
  const debouncedResizeTrigger = useDebounce(resizeTrigger, 500)

  useEffect(() => {
    console.log('chart', chart.current)
    if (!chart.current) return
    const options = getChartOps()
    chart.current.setOption(options)

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

  const curvData = [
    {
      name: "持仓时长",
      value: "1天3小时15分",
    },
    {
      name: "盈亏金额",
      value: "+25847.35",
    },
    {
      name: "盈亏比例",
      value: "+0.25%",
    },
    {
      name: "持仓市值",
      value: "+25847.35",
    },
    {
      name: "仓位占比",
      value: "+25847.35",
    }
  ]

  return <div className="border-[1px] border-[#3c3c3c] border-solid rounded-md w-full h-full p-6 box-border flex flex-col">
    <div className="text-2xl ">
      回归曲线
    </div>
    <div className="flex">
      <div className="w-[12.5rem]">
        <div className="flex items-center mt-[2.625rem]">
          <img src={imageLogo} alt="" className="w-6 h-6" />
          <span className="ml-2 text-base inline-block">AAPL</span>
        </div>
        <div className="text-sm text-[#b8b8b8] mt-[0.4375rem] indent-8 truncate">苹果发顺丰第…</div>
      </div>
      <div className="flex flex-1 justify-around items-center pr-[15%] box-border">
        {
          curvData.map((item, index) => {
            return <div key={`${index}_item`} className="min-w-[6.5rem]" >
              <div className="flex items-center mt-[2.625rem]">
                <span className="ml-2 text-base inline-block text-[#b8b8b8] leading=[1.375rem]">{item.name}</span>
              </div>
              <div className="text-base text-[#D9D9D9] mt-[0.4375rem] leading=[1.375rem]">{item.value}</div>
            </div>
          })
        }
      </div>
    </div>
    <div className="mt-[2.5rem] flex-1">
      <div ref={dom} className="w-full h-full"></div>
    </div>
  </div>
}


export default ReportCurv