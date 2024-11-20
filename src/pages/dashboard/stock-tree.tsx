import { useMemo, useState } from "react"
import { useImmer } from 'use-immer'
import { useTranslation } from "react-i18next"
import { getHotSectors } from "@/api"
import TreeMap from "./components/tree-map"
import Decimal from "decimal.js"
import { CapsuleTabs } from "@/components"
import { StockRecord } from "@/store/stock/stock"
import { useQuery } from "@tanstack/react-query"

type StockTreeType = 'industry' | 'concept' | 'bull' | 'etf' | 'industry-heatmap' | 'etf-heatmap'
type StockTreeDate = 'day' | 'week' | 'month'

const colors = [
  '#ac2532', '#782029', '#3a1a1f', '#30333c', '#112e21', '#0e532f', '#07753c'
]

const steps = [
  '-3', '-2', '-1', '0', '1', '2', '3'
]

/**
 * 归一化数据，调整矩形面积
 */


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
  const { t } = useTranslation()

  const queryData = () => {
    if (['industry', 'concept'].includes(type)) {
      return getHotSectors({
        type: date,
        sector: type as 'industry' | 'concept',
        top: 15,
        stock: ['1']
      })
    }
    return getHotSectors({
      type: date,
      sector: type as 'industry' | 'concept',
      top: 15
    })
  }

  const query = useQuery({
    queryKey: ['stock-tree', type, date],
    queryFn: queryData
  })

  const treeData = useMemo(() => {
    if (!query.data) return []

    const root = []
    const dataset: Record<string, { value: number }> = {}

    for (const node of query.data) {
      const n = { name: node.sector_name, value: node.amount, data: node.change, children: [] }
      root.push(n)

      for (const t of node.tops) {
        const stockRecord = new StockRecord(t.stock)
        const child = { name: t.symbol, value: stockRecord.turnover, data: stockRecord.percent, itemStyle: { color: getColorByStep(stockRecord.percent) } }
        dataset[child.name] = child
        n.children.push(child as never)
      }
    }

    const absValues = Object.keys(dataset).map(key => dataset[key as keyof typeof dataset].value)
    const min = Math.min(...absValues)
    const max = Math.max(...absValues)
    
    for (const k of Object.keys(dataset)) {
      dataset[k].value = ((dataset[k].value - min) / (max - min)) * (20 - 5) + 5
    }

    return root
  }, [query.data])



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
          <SimpleCheck value={[]} />
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
                <TreeMap data={treeData} />
              </div>
            </div>
          ) : (
            <div>1</div>
          )
        }
      </div>
    </div>
  )
}

interface StockTreeProps {
  value: number[]
}



// TODO: 待优化
const SimpleCheck = ({ value }: StockTreeProps) => {
  const [checked, setChecked] = useImmer([true, true, true, true, true, true, true])

  const onClick = (index: number) => {
    setChecked(draft => {
      const nextStatus = !checked[index]
      if (!nextStatus && draft.filter(Boolean).length <= 1) return
      draft[index] = nextStatus
    })
  }

  return (
    <div className="check-group flex items-center space-x-2 text-center text-xs leading-5">
      {
        steps.map((step, index) => (
          <div key={step} style={{
            background: checked[index] ? colors[index] : '#1e1e1e'
          }} onClick={() => onClick(index)} onKeyDown={() => { }}>{step}%</div>
        ))
      }
      {/* <div className={cn({ '!bg-[#ac2532]': checked[0] })} onClick={() => onClick(0)} onKeyDown={() => { }}>-3%</div>
      <div className={cn({ '!bg-[#782029]': checked[1] })} onClick={() => onClick(1)} onKeyDown={() => { }}>-2%</div>
      <div className={cn({ '!bg-[#3a1a1f]': checked[2] })} onClick={() => onClick(2)} onKeyDown={() => { }}>-1%</div>
      <div className={cn({ '!bg-[#30333c]': checked[3] })} onClick={() => onClick(3)} onKeyDown={() => { }}>-0%</div>
      <div className={cn({ '!bg-[#112e21]': checked[4] })} onClick={() => onClick(4)} onKeyDown={() => { }}>1%</div>
      <div className={cn({ '!bg-[#0e532f]': checked[5] })} onClick={() => onClick(5)} onKeyDown={() => { }}>2%</div>
      <div className={cn({ '!bg-[#07753c]': checked[6] })} onClick={() => onClick(6)} onKeyDown={() => { }}>3%</div> */}
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