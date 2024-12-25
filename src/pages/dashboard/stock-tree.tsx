import { useMemo, useState } from "react"
import { useImmer } from 'use-immer'
import { useTranslation } from "react-i18next"
import { getHotSectors, getPlateList, getUsStocks } from "@/api"
import TreeMap from "./components/tree-map"
import Decimal from "decimal.js"
import { CapsuleTabs, Skeleton } from "@/components"
import { useQuery } from "@tanstack/react-query"
import { stockManager, StockRecord } from "@/utils/stock"

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
    enabled: ['industry', 'concept'].includes(type)
  })

  const treeData = useMemo(() => {
    if (!query.data) return []

    const root = []
    const dataset: Record<string, { value: number }> = {}

    const colors = filter.map(v => getColorByStep(v / 100))

    for (const node of query.data) {
      const n = { name: node.sector_name, data: node.change, children: [] }
      root.push(n)

      for (const t of node.tops) {
        if (StockRecord.isValid(t.stock)) {
          const stockRecord = stockManager.toSimpleStockRecord(t.stock)
          const _color = getColorByStep(stockRecord.percent ?? 0)
          if (!colors.includes(_color)) continue
          const child = { name: t.symbol, value: stockRecord.turnover!, data: stockRecord.percent, color: getColorByStep(stockRecord.percent ?? 0) }
          dataset[child.name + t.plate_id] = child
          n.children.push(child as never)
        } else {
          n.children.push({ name: t.symbol, value: 0, data: 0 } as never)
        }
      }
    }

    const absValues = Object.keys(dataset).map(key => dataset[key as keyof typeof dataset].value)
    const min = Math.min(...absValues)
    const max = Math.max(...absValues)

    for (const k of Object.keys(dataset)) {
      dataset[k].value = ((dataset[k].value - min) / (max - min)) * (5 - 1) + 1
    }


    return root
  }, [query.data, filter])


  const queryPlate = useQuery({
    queryKey: [getPlateList.cacheKey, type],
    queryFn: () => getPlateList(type === 'industry-heatmap' ? 1 : 2),
    enabled: type === 'industry-heatmap' || type === 'etf-heatmap'
  })

  const dataPlate = useMemo(() => {
    const r = []

    if (!queryPlate.data) return []

    const dataset: Record<string, { value: number }> = {}

    const _colors = filter.map(v => getColorByStep(v / 100))

    for (const plate of queryPlate.data) {
      const _color = getColorByStep(plate.change / 100)
      if (!_colors.includes(_color)) continue
      const n = { name: plate.name, value: plate.amount, data: plate.change / 100, color: getColorByStep(plate.change / 100) }
      dataset[plate.id] = n
      r.push(n)
    }

    const absValues = Object.keys(dataset).map(key => dataset[key as keyof typeof dataset].value)
    const min = Math.min(...absValues)
    const max = Math.max(...absValues)

    for (const k of Object.keys(dataset)) {
      dataset[k].value = ((dataset[k].value - min) / (max - min)) * (10 - 1) + 1
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

    const dataset: Record<string, { value: number }> = {}

    const colors = filter.map(v => getColorByStep(v / 100))

    for (const stock of queryStock.data.items) {
      if (StockRecord.isValid(stock.stock)) {
        const stockRecord = stockManager.toSimpleStockRecord(stock.stock)
        const _color = getColorByStep(stockRecord.percent ?? 0)
        if (!colors.includes(_color)) continue
        const child = { name: stock.symbol, value: stockRecord.turnover ?? 0, data: stockRecord.percent, color: getColorByStep(stockRecord.percent ?? 0) }
        dataset[child.name] = child
        r.push(child as never)
      } else {
        r.push({ name: stock.symbol, value: 0, data: 0 } as never)
      }
    }

    const absValues = Object.keys(dataset).map(key => dataset[key as keyof typeof dataset].value)
    const min = Math.min(...absValues)
    const max = Math.max(...absValues)

    for (const k of Object.keys(dataset)) {
      dataset[k].value = ((dataset[k].value - min) / (max - min)) * (10 - 1) + 1
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