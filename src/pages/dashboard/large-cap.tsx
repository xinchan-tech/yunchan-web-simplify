import { getLargeCapIndexes } from "@/api"
import { useRequest } from "ahooks"
import { useMemo, useState } from "react"
import CapsuleTabs from "./components/capsule-tabs"
import { Decimal } from "decimal.js"
import clsx from "clsx"
import StockDownIcon from '@/assets/icon/stock_down.png'
import StockUpIcon from '@/assets/icon/stock_up.png'

const LargeCap = () => {
  const [activeKey, setActiveKey] = useState<string>()
  const largeCap = useRequest(getLargeCapIndexes, {
    cacheKey: 'largeCap',
    onSuccess: (data) => {
      if (!activeKey) {
        setActiveKey(data[0].category_name)
      }
    }
  })

  const tabs = useMemo(() => {
    return largeCap.data?.map(item => ({
      key: item.category_name,
      label: item.category_name,
    }))
  }, [largeCap.data])

  const stocks = useMemo(() => {
    return largeCap.data?.find(item => item.category_name === activeKey)?.stocks ?? []
  }, [activeKey, largeCap.data])

  const getStockClosePrice = (s: typeof stocks[0]) => {
    return new Decimal(s.stock[2])
  }

  // 前收盘价
  const getStockPreClosePrice = (s: typeof stocks[0]) => {
    return new Decimal(s.stock[9])
  }

  // 涨跌幅
  const calcStockPercent = (s: typeof stocks[0]) => {
    const close = getStockClosePrice(s)
    const preClose = getStockPreClosePrice(s)
    return close.minus(preClose).div(preClose).times(100).toFixed(2)
  }

  return (
    <div>
      <div className="bg-secondary py-1.5 border border-solid border-primary px-2">
        <CapsuleTabs activeKey={activeKey} onChange={setActiveKey}>
          {
            tabs?.map(item => <CapsuleTabs.Tab key={item.key} value={item.key} label={item.label} />)
          }
        </CapsuleTabs>
      </div>
      <div className="flex bg-secondary p-1.5 border border-solid border-primary justify-between space-x-2">
        {
          stocks.map(item => (
            <div
              key={item.symbol}
              className="border border-solid border-primary flex-1 hover:bg-hover text-center py-2 cursor-pointer"
            >
              <div className="text-center"><span>{item.name}</span></div>
              <div
                className={clsx(
                  'font-black text-[15px]',
                  {
                    'text-[#00a74e]': +calcStockPercent(item) >= 0,
                    'text-[#e74c3c]': +calcStockPercent(item) < 0,
                  }
                )}>
                <div className="flex items-center justify-center mt-1">
                  {getStockClosePrice(item).toFixed(3)}
                  <img className="w-5" src={ +calcStockPercent(item) >= 0 ? StockUpIcon: StockDownIcon } alt="" />
                </div>
                <div className="">{calcStockPercent(item)}%</div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default LargeCap