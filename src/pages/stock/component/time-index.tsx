import { StockChartInterval } from "@/api"
import { JknIcon, CapsuleTabs } from "@/components"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Button } from "@/components"
import { timeIndex, kChartUtils } from "../lib"
import { stockUtils } from "@/utils/stock"
import { useDomSize } from "@/hooks"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTime } from "@/store"
import dayjs from "dayjs"
import { chartEvent, type ChartEvents } from "../lib/event"
import { chartManage, useChartManage } from "../lib/store"

const leftMenu = ['盘前分时', '盘中分时', '盘后分时', '多日分时']


const ItemWidth = 55

export const TimeIndexSelect = () => {
  const interval = useChartManage(s => s.getActiveChart().interval)
  const usTime = useTime(s => s.usTime)
  const localStamp = useTime(s => s.localStamp)
  const [size, dom] = useDomSize<HTMLDivElement>()

  const getIsLastDay = useCallback((trading: StockChartInterval) => {
    const usDate = dayjs(usTime + new Date().valueOf() - localStamp).tz('America/New_York')

    if (usDate.hour() < 4) {
      return true
    }

    if (trading === StockChartInterval.INTRA_DAY) {
      return usDate.isBefore(usDate.hour(9).minute(30).second(0))
    }

    if (trading === StockChartInterval.AFTER_HOURS) {
      return usDate.isBefore(usDate.hour(16).minute(0).second(0))
    }

    return false

  }, [usTime, localStamp])

  const showCount = useMemo(() => {
    if (!size) return 8
    const count = Math.floor((size?.width - 90) / ItemWidth) - 1
    return count
  }, [size])

  const onChangeInterval = (interval: StockChartInterval) => {
    chartManage.setInterval(interval)
  }

  return (
    <div className="flex items-center w-full overflow-hidden flex-nowrap" ref={dom}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex-shrink-0">
            <Button reset className="text-xs font-normal">
              {
                timeIndex.findIndex(v => v === interval) > 3 ? '分时' : (
                  <span className="text-primary">{stockUtils.intervalToStr(interval)}
                    {
                      [StockChartInterval.PRE_MARKET, StockChartInterval.INTRA_DAY, StockChartInterval.AFTER_HOURS].includes(interval) && getIsLastDay(interval) ? '(上一交易日)' : ''
                    }
                  </span>
                )
              }
            </Button>
            <JknIcon name="arrow_down" className="w-2 h-2  ml-1" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {
            leftMenu.map((item, index) => (
              <DropdownMenuItem key={item} onClick={() => onChangeInterval(timeIndex[index])}>
                {
                  item + ([StockChartInterval.PRE_MARKET, StockChartInterval.INTRA_DAY, StockChartInterval.AFTER_HOURS].includes(timeIndex[index]) && getIsLastDay(timeIndex[index]) ? '(上一交易日)' : '')
                }
              </DropdownMenuItem>
            ))
          }
        </DropdownMenuContent>
      </DropdownMenu>
      <CapsuleTabs className="flex-nowrap overflow-hidden" type="text" activeKey={interval.toString()} onChange={v => onChangeInterval(+v)}>
        {
          timeIndex.slice(4).slice(0, showCount).map(item => (
            <CapsuleTabs.Tab className="whitespace-nowrap" key={item} label={stockUtils.intervalToStr(item)} value={item.toString()} />
          ))
        }
      </CapsuleTabs>
      {
        timeIndex.slice(4).length > showCount ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex-shrink-0">
                <Button reset className="text-xs font-normal">
                  {
                    !timeIndex.slice(4).slice(showCount).includes(interval) ? '周期' : (
                      <span className="text-primary">{stockUtils.intervalToStr(interval)}</span>
                    )
                  }
                </Button>
                <JknIcon name="arrow_down" className="w-2 h-2  ml-1" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {
                timeIndex.slice(4).slice(showCount).map((item) => (
                  <DropdownMenuItem key={item} onClick={() => onChangeInterval(+item)}>{stockUtils.intervalToStr(item)}</DropdownMenuItem>
                ))
              }
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null
      }
    </div>
  )
}

// interface TimeIndexMenuProps {
//   interval: StockChartInterval
// }

// const menus = ['盘前分时', '盘中分时', '盘后分时', '多日分时', '1分', '2分', '3分', '5分', '10分', '15分', '30分', '45分', '1小时', '2小时', '3小时', '4小时', '日线', '周线', '月线', '季线', '半年', '年线']

// export const TimeIndexMenu = (props: TimeIndexMenuProps) => {

//   const setActiveMin = (min: StockChartInterval) => {
//     kChartUtils.setTimeIndex({ timeIndex: min })
//   }

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <div>
//           <Button reset className="text-xs font-normal">
//             {
//               menus[timeIndex.findIndex(v => v === props.interval)]
//             }
//           </Button>
//         </div>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent>
//         {
//           menus.map((item, index) => (
//             <DropdownMenuItem className="justify-center" key={item} onClick={() => setActiveMin(timeIndex[index])}>{item}</DropdownMenuItem>
//           ))
//         }
//       </DropdownMenuContent>
//     </DropdownMenu>
//   )
// }