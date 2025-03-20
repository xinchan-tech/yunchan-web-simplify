import { useCallback, useState } from 'react'
import { Outlet } from 'react-router'
import { KChart } from './chart/k-chart'


const StockPage = () => {
  const [leftVisible, setLeftVisible] = useState<'full' | 'half' | 'hide'>('full')
  const [rightVisible, setRightVisible] = useState<'full' | 'hide'>('full')

  const onLeftSideChange = useCallback(() => {
    setLeftVisible(s => {
      if (s === 'full') return 'half'
      if (s === 'half') return 'hide'
      return 'full'
    })
  }, [])

  const onRightSideChange = useCallback(() => {
    setRightVisible(s => {
      if (s === 'full') return 'hide'
      return 'full'
    })
  }, [])

  return (
    <div className="h-full flex flex-nowrap overflow-hidden">
      {/* {
        leftVisible !== 'hide' ? (
          <div id="stock-trading-left-container" data-width={leftVisible} className="order w-[300px] data-[width=half]:w-[200px] data-[width=hide]:hidden h-full flex-shrink-0">
            <CollectList onCollectChange={s => setQueryParams({ symbol: s })} visible={leftVisible} />
          </div>
        ) : null
      } */}
      <div className="flex-1 order-1 h-full rounded-xs overflow-hidden">
        <KChart
          onChangeLeftSide={onLeftSideChange}
          leftSideVisible={leftVisible}
          onChangeRightSize={onRightSideChange}
          rightSideVisible={rightVisible}
        />
      </div>
      <div
        id="stock-trading-right-container"
        data-width={rightVisible}
        className="order-2 w-[360px] data-[width=hide]:hidden h-full flex-shrink-0"
      >
        <Outlet />
      </div>
    </div>
  )
}

export default StockPage
