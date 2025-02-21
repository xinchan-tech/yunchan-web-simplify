import { useCallback, useEffect, useMemo, useState } from 'react'
import { useImmer } from 'use-immer'
import { useTranslation } from 'react-i18next'
import { getHotSectors, getPlateList, getUsStocks } from '@/api'
import TreeMap from './components/tree-map'
import Decimal from 'decimal.js'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, JknIcon, Skeleton } from '@/components'
import { useQuery } from '@tanstack/react-query'
import { stockUtils, type StockSubscribeHandler } from '@/utils/stock'
import { useStockQuoteSubscribe } from '@/hooks'

type StockTreeType = 'industry' | 'concept' | 'bull' | 'etf' | 'industry-heatmap' | 'etf-heatmap'
type StockTreeDate = 'day' | 'week' | 'month'

const colors = ['#AC312E', '#782029', '#3a1a1f', '#59616C', '#1A3326', '#089950', '#1A3326']

const steps = ['-3', '-2', '-1', '0', '0.1', '2', '3']

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
    queryFn: () =>
      getHotSectors({
        type: date,
        sector: type as 'industry' | 'concept',
        top: 4,
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
    const dataset: Record<string, { value: number; originValue: number }> = {}

    const colors = filter.map(v => getColorByStep(v / 100))
    let max = Number.MIN_SAFE_INTEGER
    let min = Number.MAX_SAFE_INTEGER

    for (const node of query.data) {
      const n = { name: node.sector_name, data: node.change, children: [], value: 0, originValue: 0 }

      for (const t of node.tops) {
        const stock = stockUtils.toStock(t.stock)
        const percent = stockUtils.getPercent(stock, 2, true)!
        const _color = getColorByStep(percent / 100)

        if (!colors.includes(_color)) continue

        // Math.abs((Math.log(stock.volume) ** 5)) + 0.1
        const child = {
          name: t.symbol,
          value: Decimal.create(stock.volume).log().pow(5).abs().plus(0.1).toNumber(),
          data: percent,
          color: _color,
          originValue: stock.volume,
          plateId: t.plate_id
        }

        n.children.push(child as never)
        max = Math.max(max, stock.volume)
        min = Math.min(min, stock.volume)
        dataset[child.name + t.plate_id] = child
      }
      if (n.children.length > 0) {
        root.push(n)
      }
    }

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

  const subscribeHandler: StockSubscribeHandler<'quote'> = useCallback(
    data => {
      if (stockUtils.getTrading(data.record.time) !== 'intraDay') return
      if (!subscribeStocks.includes(data.topic)) return

      setTreeData(s => {
        for (const node of s) {
          for (const child of node.children) {
            if (child.name === data.topic) {
              child.data = Decimal.create(data.record.percent).mul(100).toDP(3).toNumber()
              const _color = getColorByStep(child.data / 100)
              if (child.color !== _color) {
                child.color = _color
              }
              return [...s]
            }
          }
        }
        return [...s]
      })
    },
    [subscribeStocks]
  )

  useStockQuoteSubscribe(subscribeStocks, subscribeHandler)

  const queryPlate = useQuery({
    queryKey: [getPlateList.cacheKey, type],
    queryFn: () => getPlateList(type === 'industry-heatmap' ? 1 : 2),
    enabled: type === 'industry-heatmap' || type === 'etf-heatmap'
  })

  const dataPlate = useMemo(() => {
    const r = []

    if (!queryPlate.data) return []

    const _colors = filter.map(v => getColorByStep(v / 100))

    for (const plate of queryPlate.data) {
      const _color = getColorByStep(plate.change / 100)
      if (!_colors.includes(_color)) continue
      const n = {
        name: plate.name,
        value: plate.amount ? Math.abs(Math.log(plate.amount) ** 5) + 0.1 : 0,
        data: plate.change,
        color: getColorByStep(plate.change / 100)
      }

      r.push(n)
    }

    return r
  }, [queryPlate.data, filter])

  const queryStock = useQuery({
    queryKey: [getUsStocks.cacheKey, type],
    queryFn: () =>
      getUsStocks({
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
      const stockRecord = stockUtils.toStock(stock.stock)
      const percent = stockUtils.getPercent(stockRecord, 2, true)!
      const _color = getColorByStep(percent / 100)
      if (!colors.includes(_color)) continue
      const child = {
        name: stock.symbol,
        value: Math.abs(Math.log(stockRecord.volume) ** 5) + 0.1,
        data: percent,
        color: _color
      }
      dataset[child.name] = child
      r.push(child as never)
    }
    return r
  }, [queryStock.data, filter])

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 h-[40px] box-border flex items-center border-b-default">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center space-x-2 text-sm">
              <div>{t(`stockTree.${type}`)}</div>
              <JknIcon.Svg name="arrow-down" size={12} />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setType('industry')}>{t('stockTree.industry')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setType('concept')}>{t('stockTree.concept')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setType('bull')}>{t('stockTree.bull')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setType('etf')}>{t('stockTree.etf')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setType('industry-heatmap')}>{t('stockTree.industryHeatmap')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setType('etf-heatmap')}>{t('stockTree.etfHeatmap')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* <CapsuleTabs activeKey={type} onChange={v => setType(v as unknown as StockTreeType)}>
          <CapsuleTabs.Tab value="industry" label={t('stockTree.industry')} />
          <CapsuleTabs.Tab value="concept" label={t('stockTree.concept')} />
          <CapsuleTabs.Tab value="bull" label={t('stockTree.bull')} />
          <CapsuleTabs.Tab value="etf" label={t('stockTree.etf')} />
          <CapsuleTabs.Tab value="industry-heatmap" label={t('stockTree.industryHeatmap')} />
          <CapsuleTabs.Tab value="etf-heatmap" label={t('stockTree.etfHeatmap')} />
        </CapsuleTabs> */}
        <div className="ml-auto">
          <SimpleCheck value={filter} onChange={setFilter} />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {['industry', 'concept'].includes(type) ? (
          <div className="h-full flex flex-col">
            {/* <CapsuleTabs type="text" activeKey={date} onChange={v => setDate(v as unknown as StockTreeDate)}>
              <CapsuleTabs.Tab value="day" label={t('stockTree.today')} />
              <CapsuleTabs.Tab value="week" label={t('stockTree.week')} />
              <CapsuleTabs.Tab value="month" label={t('stockTree.month')} />
            </CapsuleTabs> */}
            <div className="flex-1 p-1 overflow-hidden">
              {!query.isLoading ? (
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
              )}
            </div>
          </div>
        ) : ['industry-heatmap', 'etf-heatmap'].includes(type) ? (
          <div className="h-full overflow-hidden">
            {!queryPlate.isLoading ? (
              <TreeMap data={dataPlate as any} />
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
              </div>
            )}
          </div>
        ) : ['bull', 'etf'].includes(type) ? (
          <div className="h-full overflow-hidden">
            {!queryStock.isLoading ? (
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
            )}
          </div>
        ) : null}
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
      <JknIcon.Svg name="filter" size={12} className="cursor-pointer" />
      {/* {steps.map((step, index) => (
        <div
          key={step}
          style={{
            background: value.includes(+step) ? colors[index] : '#1e1e1e'
          }}
          onClick={() => onClick(+step)}
          onKeyDown={() => { }}
        >
          {step}%
        </div>
      ))}
      <style jsx>{`
          .check-group > div {!
            background: #1e1e1e;
            border-radius: 4px;
            color: white;
            width: 38px;
            cursor: pointer;
            transition: all .2s ease-in-out;
          }
        `}</style> */}
    </div>
  )
}

export default StockTree
