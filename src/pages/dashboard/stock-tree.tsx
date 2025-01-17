import { useCallback, useEffect, useMemo, useState } from "react"
import { useImmer } from 'use-immer'
import { useTranslation } from "react-i18next"
import { getHotSectors, getPlateList, getUsStocks } from "@/api"
import TreeMap from "./components/tree-map"
import Decimal from "decimal.js"
import { CapsuleTabs, Skeleton } from "@/components"
import { useQuery } from "@tanstack/react-query"
import { stockUtils, StockRecord, type StockSubscribeHandler } from "@/utils/stock"
import { useStockQuoteSubscribe } from "@/hooks"

type StockTreeType = 'industry' | 'concept' | 'bull' | 'etf' | 'industry-heatmap' | 'etf-heatmap'
type StockTreeDate = 'day' | 'week' | 'month'

const colors = [
  '#ac2532', '#782029', '#3a1a1f', '#30333c', '#112e21', '#0e532f', '#07753c'
]

const steps = [
  '-3', '-2', '-1', '0', '1', '2', '3'
]

const getColorByStep = (step: string | number) => {
  const n = new Decimal(step).times(100)
  if (n.isNaN()) return '#1e1e1e'

  for (let i = 0; i < steps.length; i++) {
    const step = new Decimal(steps[i])
    if (n.lte(step)) return colors[i]
  }

  return colors[colors.length - 1]
}

const StockTree = () => {
  const [type, setType] = useState<StockTreeType>('industry')
  const [date, setDate] = useState<StockTreeDate>('day')
  const [filter, setFilter] = useImmer(steps.map(Number))
  const { t } = useTranslation()

  const query = useQuery({
    queryKey: [getHotSectors.cacheKey, type, date],
    queryFn: () => getHotSectors({
      type: date,
      sector: type as 'industry' | 'concept',
      top: 15,
      stock: ['1']
    }),
    refetchInterval: 30 * 1000,
    enabled: ['industry', 'concept'].includes(type)
  })

  const [treeData, setTreeData] = useState<any[]>([])

  useEffect(() => {
    if (!query.data) {
      setTreeData([])
      return
    }

    const root = []
    const dataset: Record<string, { area: number, originArea: number }> = {}

    const colors = filter.map(v => getColorByStep(v / 100))
    let max = Number.MIN_SAFE_INTEGER
    let min = Number.MAX_SAFE_INTEGER

    for (const node of query.data) {
      const n = { name: node.sector_name, data: node.change, children: [], area: 0, originArea: 0 }
      root.push(n)

      for (const t of node.tops) {
        const stock = stockUtils.toStock(t.stock)
        const percent = stockUtils.getPercent(stock, 2, true)!
        const _color = getColorByStep(percent / 100)

        if (!colors.includes(_color)) continue

        const child = { name: t.symbol, area: stock.volume, data: percent, color: _color, originArea: stock.volume, plateId: t.plate_id }
        n.children.push(child as never)
        max = Math.max(max, stock.volume)
        min = Math.min(min, stock.volume)
        dataset[child.name + t.plate_id] = child
      }
    }


    for (const k of Object.keys(dataset)) {
      dataset[k].area = ((dataset[k].originArea - min) / (max - min)) * (5 - 1) + 1
    }
    console.log(root)
    setTreeData(root)
  }, [query.data, filter])



  const subscribeStocks = useMemo(() => {
    if (!query.data) return []
    const stocks = new Set<string>()
    for (const node of query.data) {
      for (const t of node.tops) {
        stocks.add(t.symbol)
      }
    }
    return Array.from(stocks)
  }, [query.data])

  const subscribeHandler: StockSubscribeHandler<'quote'> = useCallback((data) => {
    if (!subscribeStocks.includes(data.topic)) return

    setTreeData(s => {
      for (const node of s) {
        for (const child of node.children) {
          if (child.name === data.topic) {
            child.data = Decimal.create(data.record.percent).toDP(3).toNumber()
            return [...s]
          }
        }
      }
      return [...s]
    })
  }, [subscribeStocks])

  useStockQuoteSubscribe(subscribeStocks, subscribeHandler)

  const queryPlate = useQuery({
    queryKey: [getPlateList.cacheKey, type],
    queryFn: () => getPlateList(type === 'industry-heatmap' ? 1 : 2),
    enabled: type === 'industry-heatmap' || type === 'etf-heatmap'
  })

  const dataPlate = useMemo(() => {
    const r = []

    if (!queryPlate.data) return []

    const dataset: Record<string, { area: number }> = {}
    let max = Number.MIN_SAFE_INTEGER
    let min = Number.MAX_SAFE_INTEGER

    const _colors = filter.map(v => getColorByStep(v / 100))

    for (const plate of queryPlate.data) {
      const _color = getColorByStep(plate.change / 100)
      if (!_colors.includes(_color)) continue
      const n = { name: plate.name, area: plate.amount, data: plate.change, color: getColorByStep(plate.change / 100) }
      dataset[plate.id] = n
      max = Math.max(max, plate.amount)
      min = Math.min(min, plate.amount)
      r.push(n)
    }

    for (const k of Object.keys(dataset)) {
      dataset[k].area = ((dataset[k].area - min) / (max - min)) * (10 - 1) + 1
    }

    return r
  }, [queryPlate.data, filter])


  const queryStock = useQuery({
    queryKey: [getUsStocks.cacheKey, type],
    queryFn: () => getUsStocks({
      type: type === 'bull' ? 'EXCLUDE_ETF' : 'ETF',
      column: 'amount',
      limit: 50,
      page: 1,
      order: 'desc',
      extend: ['basic_index', 'stock_before', 'stock_after', 'total_share', 'collect', 'financials']
    }),
    enabled: type === 'bull' || type === 'etf'
  })


  const dataStock = useMemo(() => {
    const r: any[] = []

    if (!queryStock.data) return []

    const dataset: Record<string, { area: number }> = {}
    let max = Number.MIN_SAFE_INTEGER
    let min = Number.MAX_SAFE_INTEGER
    const colors = filter.map(v => getColorByStep(v / 100))

    for (const stock of queryStock.data.items) {
      const stockRecord = stockUtils.toStock(stock.stock)
      const percent = stockUtils.getPercent(stockRecord, 2, true)!
      const _color = getColorByStep(percent / 100)
      if (!colors.includes(_color)) continue
      const child = { name: stock.symbol, area: stockRecord.turnover ?? 0, data: percent, color: _color }
      dataset[child.name] = child
      max = Math.max(max, stockRecord.turnover)
      min = Math.min(min, stockRecord.turnover)
      r.push(child as never)
    }

    for (const k of Object.keys(dataset)) {
      dataset[k].area = ((dataset[k].area - min) / (max - min)) * (10 - 1) + 1
    }

    return r
  }, [queryStock.data, filter])


  return (
    <div className="h-full flex flex-col">
      <div className="p-1 border-style-primary h-[34px] box-border flex items-center">
        <CapsuleTabs activeKey={type} onChange={(v) => setType(v as unknown as StockTreeType)}>
          <CapsuleTabs.Tab value="industry" label={t('stockTree.industry')} />
          <CapsuleTabs.Tab value="concept" label={t('stockTree.concept')} />
          <CapsuleTabs.Tab value="bull" label={t('stockTree.bull')} />
          <CapsuleTabs.Tab value="etf" label={t('stockTree.etf')} />
          <CapsuleTabs.Tab value="industry-heatmap" label={t('stockTree.industryHeatmap')} />
          <CapsuleTabs.Tab value="etf-heatmap" label={t('stockTree.etfHeatmap')} />
        </CapsuleTabs>
        <div className="ml-auto">
          <SimpleCheck value={filter} onChange={setFilter} />
        </div>

      </div>
      <div className="flex-1">
        {
          ['industry', 'concept'].includes(type) ? (
            <div className="h-full flex flex-col">
              <CapsuleTabs type="text" activeKey={date} onChange={(v) => setDate(v as unknown as StockTreeDate)}>
                <CapsuleTabs.Tab value="day" label={t('stockTree.today')} />
                <CapsuleTabs.Tab value="week" label={t('stockTree.week')} />
                <CapsuleTabs.Tab value="month" label={t('stockTree.month')} />
              </CapsuleTabs>
              <div className="flex-1 p-1">
                {
                  !query.isLoading ? (
                    <TreeMap data={treeData} />
                  ) : (
                    <div className="space-y-2">
                      <Skeleton className="h-4" />
                      <Skeleton className="h-4" />
                      <Skeleton className="h-4" />
                      <Skeleton className="h-4" />
                      <Skeleton className="h-4" />
                      <Skeleton className="h-4" />
                    </div>
                  )
                }
              </div>
            </div>
          ) : ['industry-heatmap', 'etf-heatmap'].includes(type) ? (
            <div className="h-full">
              {
                !queryPlate.isLoading ? (
                  <TreeMap data={dataPlate} />
                ) : (
                  <div className="space-y-2">
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                  </div>
                )
              }
            </div>
          ) : ['bull', 'etf'].includes(type) ? (
            <div className="h-full">
              {
                !queryStock.isLoading ? (
                  <TreeMap data={dataStock} />
                ) : (
                  <div className="space-y-2">
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                  </div>
                )
              }
            </div>
          ) : null
        }
      </div>
    </div>
  )
}

interface StockTreeProps {
  value: number[]
  onChange?: (v: number[]) => void
}


const SimpleCheck = ({ value, onChange }: StockTreeProps) => {
  const onClick = (v: number) => {
    if (value.includes(v)) {
      if (value.length === 1) {
        return
      }
      onChange?.(value.filter(_v => _v !== v))
    } else {
      onChange?.([...value, v])
    }
  }

  return (
    <div className="check-group flex items-center space-x-2 text-center text-xs leading-5">
      {
        steps.map((step, index) => (
          <div key={step} style={{
            background: value.includes(+step) ? colors[index] : '#1e1e1e'
          }} onClick={() => onClick(+step)} onKeyDown={() => { }}>{step}%</div>
        ))
      }
      <style jsx>{`
          .check-group > div {!
            background: #1e1e1e;
            border-radius: 4px;
            color: white;
            width: 38px;
            cursor: pointer;
            transition: all .2s ease-in-out;
          }
        `}</style>
    </div>
  )
}

export default StockTree