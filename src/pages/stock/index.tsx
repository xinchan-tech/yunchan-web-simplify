import { CollectList } from '@/components'
import { useQueryParams } from '@/hooks'
import { useCallback, useState } from 'react'
import { useParams } from 'react-router'
import { KChart } from './chart/k-chart'
import { StockInfo } from './chart/stock-info'
import { Finance } from './finance'

/**
 * TODO 分时图X轴需要单独处理
 */
const StockPage = () => {
  const [_, setQueryParams] = useQueryParams()
  const params = useParams<{ type: string }>()
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
    <div className="h-full flex flex-nowrap bg-muted overflow-hidden">
      {/* {
        leftVisible !== 'hide' ? (
          <div id="stock-trading-left-container" data-width={leftVisible} className="order w-[300px] data-[width=half]:w-[200px] data-[width=hide]:hidden h-full flex-shrink-0">
            <CollectList onCollectChange={s => setQueryParams({ symbol: s })} visible={leftVisible} />
          </div>
        ) : null
      } */}
      <div className="flex-1 order-1 h-full">
        {params.type && !['finance'].includes(params.type) ? (
          <KChart
            onChangeLeftSide={onLeftSideChange}
            leftSideVisible={leftVisible}
            onChangeRightSize={onRightSideChange}
            rightSideVisible={rightVisible}
          />
        ) : (
          <Finance />
        )}
      </div>
      {params.type && !['finance'].includes(params.type) && (
        <div
          id="stock-trading-right-container"
          data-width={rightVisible}
          className="order-2 w-[300px] data-[width=hide]:hidden h-full flex-shrink-0"
        >
          <StockInfo />
        </div>
      )}
    </div>
  )
}

export default StockPage
