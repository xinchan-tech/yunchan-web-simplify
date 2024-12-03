import { StockChartInterval } from "@/api"
import { Button, CapsuleTabs, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, JknIcon, Separator } from "@/components"
import { useState } from "react"
import { Fragment } from "react/jsx-runtime"
import { useImmer } from "use-immer"
import { KChartContext, type KChartState, timeIndex, useKChartContext, useSymbolQuery } from "./lib"
import { MainChart } from "./component/main-chart"

const leftMenu = ['盘前分时', '盘中分时', '盘后分时', '多日分时']
const rightMenu = ['周线', '月线', '季线', '半年', '年线']

const rightMenuStartIndex = timeIndex.length - rightMenu.length

export const KChart = () => {
  const [context, setContext] = useImmer<KChartState>({ timeIndex: StockChartInterval.DAY, viewMode: 'signal' })
  const symbol = useSymbolQuery()


  return (
    <div className="h-full overflow-hidden flex flex-col">
      <KChartContext.Provider value={{ ...context, setState: setContext }}>
        <div className="w-full flex-shrink-0">
          <div className="flex border border-solid border-border px-4">
            <TimeIndexSelect />
          </div>
          <ChartToolSelect />
          <ChartChanTool />
        </div>
        <div className="flex-1 overflow-hidden main-chart" data-view={context.viewMode}>
          <div className="chart-item">
            <MainChart />
          </div>
        </div>
      </KChartContext.Provider>
      <style jsx>{`
         .main-chart {
           display: grid;
         }

         .chart-item {
           gird-area: 'chart'
         }

         .main-chart[data-view="single"] {
           grid-template-areas: 'chart';
           grid-template-columns: 1fr;
         }
      `}</style>
    </div >
  )
}

const TimeIndexSelect = () => {
  const { timeIndex: activeMin, setState } = useKChartContext()
  const setActiveMin = (min: StockChartInterval) => {
    setState(state => ({ ...state, timeIndex: min }))
  }
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div>
            <Button reset className="text-xs font-normal">
              {
                timeIndex.findIndex(v => v === activeMin) > 3 ? '分时' : (
                  <span className="text-primary">{leftMenu[timeIndex.findIndex(v => v === activeMin)].slice(0, 2)}</span>
                )
              }
            </Button>
            <JknIcon name="arrow_down" className="w-2 h-2  ml-1" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {
            leftMenu.map((item, index) => (
              <DropdownMenuItem key={item} onClick={() => (timeIndex[index])}>{item}</DropdownMenuItem>
            ))
          }
        </DropdownMenuContent>
      </DropdownMenu>
      <CapsuleTabs type="text" activeKey={activeMin.toString()} onChange={v => setActiveMin(+v)}>
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
                  timeIndex.findIndex(v => v === activeMin) < rightMenuStartIndex ? '周期' : (
                    <span className="text-primary">{rightMenu[timeIndex.findIndex(v => v === activeMin) - rightMenuStartIndex]}</span>
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

const CHART_TOOL = ['主图指标', '线型切换', '多图模式', '股票PK', '叠加标记', '画线工具']

const ChartToolSelect = () => {
  const [toolType, setToolType] = useState<string>('')
  return (
    <div className="border-style-primary flex items-center px-2 !border-t-0">
      <div className="flex items-center space-x-3">
        {
          CHART_TOOL.map((item, index) => (
            <JknIcon key={item} label={item} className="w-4 h-4 py-1.5" name={`stock_${index + 1}` as IconName} checked={toolType === item} onClick={() => setToolType(item)} />
          ))
        }
      </div>
      <div>

      </div>
    </div>
  )
}

const ChartChanTool = () => {
  return (
    <div className="border-style-primary flex items-center px-2 !border-t-0">
      <JknIcon name="chan_pen_nor" className="w-4 h-4 py-1.5" />
    </div>
  )
}