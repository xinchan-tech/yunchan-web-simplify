import type { StockChartInterval } from "@/api"
import { JknIcon, CapsuleTabs } from "@/components"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Button } from "@/components"
import { useKChartContext, timeIndex } from "../lib"
import { Fragment } from "react/jsx-runtime"

const leftMenu = ['盘前分时', '盘中分时', '盘后分时', '多日分时']
const rightMenu = ['周线', '月线', '季线', '半年', '年线']

const rightMenuStartIndex = timeIndex.length - rightMenu.length

export const TimeIndexSelect = () => {
  const { setTimeIndex, activeChart } = useKChartContext()
  const _activeChart = activeChart()
  const setActiveMin = (min: StockChartInterval) => {
    setTimeIndex({ timeIndex: min })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div>
            <Button reset className="text-xs font-normal">
              {
                timeIndex.findIndex(v => v === _activeChart.timeIndex) > 3 ? '分时' : (
                  <span className="text-primary">{{
                    '-2': '盘后',
                    '0': '盘中',
                    '-1': '盘前',
                    '7200': '多日'
                  }[_activeChart.timeIndex.toString()] ?? null}</span>
                )
              }
            </Button>
            <JknIcon name="arrow_down" className="w-2 h-2  ml-1" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {
            leftMenu.map((item, index) => (
              <DropdownMenuItem key={item} onClick={() => setActiveMin(timeIndex[index])}>{item}</DropdownMenuItem>
            ))
          }
        </DropdownMenuContent>
      </DropdownMenu>
      <CapsuleTabs type="text" activeKey={_activeChart.timeIndex.toString()} onChange={v => setActiveMin(+v)}>
        {
          timeIndex.slice(4).slice(0, -5).map(item => (
            <Fragment key={item}>
              {
                item < 60 ? (
                  <CapsuleTabs.Tab label={`${item}分钟`} value={item.toString()} />
                ) : item < 1440 ? (
                  <CapsuleTabs.Tab label={`${item / 60}小时`} value={item.toString()} />
                ) : (
                  <CapsuleTabs.Tab label="日线" value={item.toString()} />
                )
              }
            </Fragment>
          ))
        }
      </CapsuleTabs>
      <div className="ml-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div>
              <Button reset className="text-xs font-normal">
                {
                  timeIndex.findIndex(v => v === _activeChart.timeIndex) < rightMenuStartIndex ? '周期' : (
                    <span className="text-primary">{rightMenu[timeIndex.findIndex(v => v === _activeChart.timeIndex) - rightMenuStartIndex]}</span>
                  )
                }
              </Button>
              <JknIcon name="arrow_down" className="w-2 h-2  ml-1" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {
              rightMenu.map((item, index) => (
                <DropdownMenuItem key={item} onClick={() => setActiveMin(timeIndex[index + rightMenuStartIndex])}>{item}</DropdownMenuItem>
              ))
            }
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}