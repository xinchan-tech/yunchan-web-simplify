import { useChart } from "@/hooks";
import { useEffect, useMemo, useState } from "react";
import { getLineChartOps } from '../const'
import { useDebounce } from 'ahooks'
import { StockView } from '@/components'
import { useQuery } from '@tanstack/react-query'
import { type StockTrading, stockUtils } from '@/utils/stock'
import { getStockInvestProfit } from '@/api'
import { numToDay } from '@/utils/date'
import BigNumber from 'bignumber.js';
import dayjs from "dayjs";
type TableDataType = ReturnType<typeof stockUtils.toStockWithExt>
import Decimal from 'decimal.js'
import { numberFormat } from '../const'

type XArrType = string[]
type YArrType = number[]

interface ChartData {
  xArr: XArrType
  yArr: YArrType;
}

const ReportCurv = ({ rowdata }: { rowdata: TableDataType }) => {
  const [chart, dom] = useChart()
  const [resizeTrigger, setResizeTrigger] = useState(0)
  const debouncedResizeTrigger = useDebounce(resizeTrigger, 500)
  const [yArr, setYArr] = useState<YArrType>([])

  const averageValue = useMemo(() => {
    return new BigNumber(rowdata.cost || 0).multipliedBy(new BigNumber(rowdata.quantity || 0)).toFixed(2);
  }, [rowdata.cost, rowdata.quantity])

  useEffect(() => {
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
      name: "盈亏金额",
      value: ({ profit_loss = 0 }) => numberFormat(profit_loss)
    },
    {
      name: "盈亏比例",
      value: ({ return_rate = 0 }) => <span>{numberFormat(return_rate, 100)}</span>
    },
    {
      name: "持仓市值",
      value: ({ market_cap = 0 }) => `${market_cap > 0 ? '+' : ''}${Decimal.create(market_cap).toShortCN(3)}`
    },
    {
      name: "持仓数量",
      value: ({ quantity = 0 }) => quantity
    },
    {
      name: "仓位占比",
      value: ({ position_rate = 0 }) => numberFormat(position_rate, 100)
    },
    {
      name: "持仓时长",
      value: ({ position_time = 0 }) => numToDay(position_time),
    },
  ]

  useEffect(() => {
    console.log('rowdata', rowdata)
    if (rowdata?.symbol) {
      querygetStockChartKline()
    }

  }, [rowdata])

  function querygetStockChartKline() {
    getStockInvestProfit({
      symbol: rowdata?.symbol,
    }).then(({ status, data }) => {
      if (status == 1) {
        const xArr: XArrType = []
        const yArr: YArrType = []

        data.forEach(v => {
          yArr.push(v.value)
          xArr.push(v.name)
        })
        setYArr(yArr)
        setChartOption({ xArr, yArr })
      }
    })
  }

  function setChartOption(data: ChartData) {
    if (!chart.current) return
    const options = getLineChartOps(averageValue, data)
    chart.current.setOption(options)
  }

  const handelUpdate = () => {
    const newYArr = yArr.map((v, i) => {
      return i == yArr.length - 1 ? Math.random() * 1000 : v
    })
    console.log(55555, newYArr)
    const a = [1300, 1400, 2500, 2600, 2700, 1600]
    chart?.current?.setOption({ xAxis:{data:a},series: [{ data: a }, { data: a.map(i => i >= Number(averageValue) ? i : Number(averageValue)) }, { data: a.map(i => i < Number(averageValue) ? i : Number(averageValue)) }] })
  }

  return <div className="bg-[#1A191B] rounded-[2rem] w-[28.25rem] w-full h-full p-6 box-border flex flex-col">
    <div className="text-2xl ">
      回报曲线
    </div>
    {/* <div onClick={() => handelUpdate()}>更新数据</div> */}
    <div className="flex">
      <div className="w-[12.5rem] flex items-end">
        <div className="flex max-w-full items-end ">
          {rowdata && <StockView isDoubleClicIcon={false} name={rowdata?.name} code={rowdata?.code as string} showName className="" />}
          {/* <img src={imageLogo} alt="" className="w-6 h-6" /> */}
          {/* <JknIcon stock={data?.[0]} className="mr-3" /> */}
          {/* <span className="ml-2 text-base inline-block">AAPL</span> */}
        </div>
        {/* <div className="text-sm text-[#b8b8b8] mt-[0.4375rem] indent-8 truncate">苹果发顺丰第…</div> */}
      </div>
      <div className="flex flex-1 justify-around items-center pr-[15%] box-border">
        {
          curvData.map((item, index) => {
            return <div key={`${index}_item`} className="min-w-[6.5rem]" >
              <div className="flex items-center mt-[2.625rem]">
                <span className="text-base inline-block text-[#b8b8b8] leading=[1.375rem]">{item.name}</span>
              </div>
              <div className="text-base text-[#D9D9D9] mt-[0.4375rem] leading=[1.375rem] whitespace-nowrap text-ellipsis overflow-hidden">
                {
                  typeof item.value == 'function' ? item.value(rowdata) : item.value
                }
              </div>
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