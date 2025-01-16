import { StockChartInterval } from "@/api"
import { JknIcon, CapsuleTabs } from "@/components"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Button } from "@/components"
import { useKChartContext, timeIndex } from "../lib"
import { stockUtils } from "@/utils/stock"
import { useDomSize } from "@/hooks"
import { useCallback, useMemo } from "react"
import { useTime } from "@/store"
import dayjs from "dayjs"

const leftMenu = ['盘前分时', '盘中分时', '盘后分时', '多日分时']


const ItemWidth = 55

export const TimeIndexSelect = () => {
  const { setTimeIndex, state, activeChartIndex } = useKChartContext()
  const _activeChart = state[activeChartIndex]
  const setActiveMin = (min: StockChartInterval) => {
    setTimeIndex({ timeIndex: min })
  }
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



  return (
    <div className="flex items-center w-full overflow-hidden flex-nowrap" ref={dom}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex-shrink-0">
            <Button reset className="text-xs font-normal">
              {
                timeIndex.findIndex(v => v === _activeChart.timeIndex) > 3 ? '分时' : (
                  <span className="text-primary">{stockUtils.intervalToStr(_activeChart.timeIndex)}
                    {
                      [StockChartInterval.PRE_MARKET, StockChartInterval.INTRA_DAY, StockChartInterval.AFTER_HOURS].includes(_activeChart.timeIndex) && getIsLastDay(_activeChart.timeIndex) ? '(上一交易日)' : ''
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
              <DropdownMenuItem key={item} onClick={() => setActiveMin(timeIndex[index])}>
                {
                  item + ([StockChartInterval.PRE_MARKET, StockChartInterval.INTRA_DAY, StockChartInterval.AFTER_HOURS].includes(timeIndex[index]) && getIsLastDay(timeIndex[index]) ? '(上一交易日)' : '')
                }
              </DropdownMenuItem>
            ))
          }
        </DropdownMenuContent>
      </DropdownMenu>
      <CapsuleTabs className="flex-nowrap overflow-hidden" type="text" activeKey={_activeChart.timeIndex.toString()} onChange={v => setActiveMin(+v)}>
        {
          timeIndex.slice(4).slice(0, showCount).map(item => (
            <CapsuleTabs.Tab className="whitespace-nowrap" key={item} label={stockUtils.intervalToStr(item)} value={item.toString()} />
          ))
        }
      </CapsuleTabs>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex-shrink-0">
            <Button reset className="text-xs font-normal">
              {
                !timeIndex.slice(4).slice(showCount).includes(_activeChart.timeIndex) ? '周期' : (
                  <span className="text-primary">{stockUtils.intervalToStr(_activeChart.timeIndex)}</span>
                )
              }
            </Button>
            <JknIcon name="arrow_down" className="w-2 h-2  ml-1" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {
            timeIndex.slice(4).slice(showCount).map((item) => (
              <DropdownMenuItem key={item} onClick={() => setActiveMin(+item)}>{stockUtils.intervalToStr(item)}</DropdownMenuItem>
            ))
          }
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

interface TimeIndexMenuProps {
  index: number
}

const menus = ['盘前分时', '盘中分时', '盘后分时', '多日分时', '1分', '2分', '3分', '5分', '10分', '15分', '30分', '45分', '1小时', '2小时', '3小时', '4小时', '日线', '周线', '月线', '季线', '半年', '年线']

export const TimeIndexMenu = (props: TimeIndexMenuProps) => {
  const { setTimeIndex, state } = useKChartContext()
  const _activeChart = state[props.index]
  const setActiveMin = (min: StockChartInterval) => {
    setTimeIndex({ index: props.index, timeIndex: min })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>
          <Button reset className="text-xs font-normal">
            {
              menus[timeIndex.findIndex(v => v === _activeChart.timeIndex)]
            }
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {
          menus.map((item, index) => (
            <DropdownMenuItem className="justify-center" key={item} onClick={() => setActiveMin(timeIndex[index])}>{item}</DropdownMenuItem>
          ))
        }
      </DropdownMenuContent>
    </DropdownMenu>
  )
}