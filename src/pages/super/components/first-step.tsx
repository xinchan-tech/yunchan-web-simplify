import { getPlateList, getPlateStocks, getRecommendIndex, getStockCollects, type StockExtend } from "@/api"
import { Checkbox, JknIcon, JknTable, NumSpan, ScrollArea, StockView, type JknTableProps } from "@/components"
import DoubleTable from "./double-table"
import { useCollectCates, useStock, useTime } from "@/store"
import { numToFixed, priceToCnUnit } from "@/utils/price"
import { cn } from "@/utils/style"
import { useMount, useRequest, useUpdateEffect } from "ahooks"
import { useMemo, useState } from "react"
import { useImmer } from "use-immer"

const baseExtends: StockExtend[] = ['total_share', 'basic_index', 'day_basic', 'alarm_ai', 'alarm_all', 'financials']

const FirstStep = () => {
  const [type, setType] = useState('golden')

  const onClickType = (type: string) => {
    setType(type)
  }

  return (
    <div className="h-[400px] flex items-center border-0 border-b border-solid border-background">
      <div className="w-36 px-4 flex items-center flex-shrink-0 border border-solid border-background h-full">
        第一步：选股范围
      </div>
      <div className="h-full overflow-hidden flex-1 ">
        <div className="flex w-full">
          <div className={cn(
            'w-1/4 text-center py-4 text-sm border border-solid border-background -ml-[1px]',
            type === 'golden' && 'text-primary'
          )} onClick={() => onClickType('golden')} onKeyDown={() => { }}>股票金池</div>
          <div className={cn(
            'w-1/4 text-center py-4 text-sm border border-solid border-background -ml-[1px]',
            type === 'spec' && 'text-primary'
          )} onClick={() => onClickType('spec')} onKeyDown={() => { }}>特色榜单</div>
          <div className={cn(
            'w-1/4 text-center py-4 text-sm border border-solid border-background -ml-[1px]',
            type === 'industry' && 'text-primary'
          )} onClick={() => onClickType('industry')} onKeyDown={() => { }}>行业板块</div>
          <div className={cn(
            'w-1/4 text-center py-4 text-sm border border-solid border-background -ml-[1px]',
            type === 'concept' && 'text-primary'
          )} onClick={() => onClickType('concept')} onKeyDown={() => { }}>概念板块</div>
        </div>
        {
          {
            golden: <GoldenPoolTabContent />,
            spec: <RecommendIndex />,
            industry: <Plate type={1} />,
            concept: <Plate type={2} />,
          }[type]
        }
      </div>
    </div>
  )
}

const GoldenPoolTabContent = () => {
  const [cateId, setCateId] = useState(1)
  return (
    <div className="flex h-full overflow-hidden">
      <GoldenPool onChange={setCateId} />
      <GoldenPoolList cateId={cateId} />
    </div>
  )
}

interface GoldenPoolProps {
  onChange?: (id: number) => void
}

const GoldenPool = (props: GoldenPoolProps) => {
  const { collects, refresh } = useCollectCates()

  useMount(() => {
    refresh()
  })

  const columns: JknTableProps<{ name: string, id: string }>['columns'] = [
    {
      header: () => <JknIcon name="checkbox_mult_nor" />,
      accessorKey: 'select',
      id: 'select',
      enableSorting: false,
      meta: { align: 'center', width: 60 },
      cell: ({ row }) => (
        <div className="flex items-center justify-center w-full"><Checkbox checked={row.getIsSelected()} onCheckedChange={(e) => row.toggleSelected(e as boolean)} /></div>
      ),
    },
    {
      header: '序号',
      accessorKey: 'index',
      enableSorting: false,
      meta: { align: 'center', width: 60 },
      cell: ({ row }) => (
        <div className="text-center">{row.index + 1}</div>
      )
    },
    {
      header: '金池名称',
      accessorKey: 'name',
      enableSorting: false,
    }
  ]

  return (
    <ScrollArea className="h-[calc(100%-52px)] w-[30%]">
      <JknTable onRowClick={(r, row) => { row.toggleSelected(); props.onChange?.(+r.id) }} data={collects} columns={columns} />
    </ScrollArea>
  )

}

interface GoldenPoolListProps {
  cateId: number
}
const GoldenPoolList = (props: GoldenPoolListProps) => {
  const query = useRequest(getStockCollects, {
    cacheKey: getStockCollects.cacheKey,
    defaultParams: [{
      extend: baseExtends,
      cate_id: props.cateId,
      limit: 300
    }]
  })

  const stock = useStock()

  useUpdateEffect(() => {
    query.run({
      extend: baseExtends,
      cate_id: props.cateId,
      limit: 300
    })
  }, [props.cateId])

  const data = useMemo(() => {
    if (!query.data) return []

    const r = []

    for (const { stock: _stock, name, symbol } of query.data.items) {
      const lastData = stock.getLastRecordByTrading(symbol, 'intraDay')
      r.push({
        code: symbol,
        name: name,
        price: lastData?.close,
        percent: lastData?.percent,
        total: lastData?.marketValue,
        amount: lastData?.turnover,
      })
    }

    return r

  }, [query.data, stock])

  const columns: JknTableProps['columns'] = [
    {
      header: '序号',
      accessorKey: 'index',
      enableSorting: false,
      meta: { align: 'center', width: 60 },
      cell: ({ row }) => (
        <div className="text-center">{row.index + 1}</div>
      )
    },
    {
      header: '金池名称',
      accessorKey: 'name',
      enableSorting: false,
      cell: ({ row }) => (
        <StockView name={row.getValue('name')} code={row.original.code as string} />
      )
    },
    {
      header: '现价',
      accessorKey: 'price',
      meta: { align: 'right', },
      cell: ({ row }) => (
        <NumSpan value={numToFixed(row.getValue<number>('price')) ?? 0} isPositive={row.getValue<number>('percent') >= 0} />
      )
    },
    {
      header: '涨跌幅',
      accessorKey: 'percent',
      meta: { align: 'right', },
      cell: ({ row }) => (
        <NumSpan percent block decimal={2} value={row.getValue<number>('percent') * 100} isPositive={row.getValue<number>('percent') >= 0} symbol />
      )
    },
    {
      header: '成交额',
      accessorKey: 'amount',
      meta: { align: 'right', width: 120 },
      cell: ({ row }) => priceToCnUnit(row.getValue<number>('amount'))
    },
    {
      header: '总市值',
      accessorKey: 'total',
      meta: { align: 'right', width: 120 },
      cell: ({ row }) => priceToCnUnit(row.getValue<number>('total'))
    }
  ]
  return (
    <ScrollArea className="h-[calc(100%-52px)] w-[70%]">
      <JknTable columns={columns} data={data} />
    </ScrollArea>
  )
}


const RecommendIndex = () => {
  const query = useRequest(getRecommendIndex, {
    defaultParams: [{
      type: 2,
      extend: ['total_share']
    }]
  })

  return (
    <div>123</div>
  )
}

//板块组件
const Plate = (props: {type: 1 | 2}) => {
  const [activePlate, setActivePlate] = useState<string>()
  const plate = useRequest(getPlateList, {
    defaultParams: [props.type],
    onSuccess: (data) => {
      setActivePlate(data[0].id)
      plateStocks.run(+data[0].id, ['basic_index', 'stock_before', 'stock_after', 'total_share', 'collect', 'financials'])
    }
  })

  useUpdateEffect(() => {
    plate.run(props.type)
  }, [props.type])

  const plateStocks = useRequest(getPlateStocks, {
    manual: true
  })

  const onClickPlate = (row: PlateDataType) => {
    setActivePlate(row.id)
  }

  return (
    <div className="flex overflow-hidden h-full">
      <div className="w-[30%]">
        <ScrollArea className="h-full">
          <PlateList data={plate.data ?? []} onRowClick={onClickPlate} />
        </ScrollArea>
      </div>
      <div className="w-[70%]">
        <ScrollArea className="h-full">
          <PlateStocks plateId={activePlate ? +activePlate : undefined} />
        </ScrollArea>
      </div>
    </div>
  )
}


type PlateDataType = {
  amount: number
  change: number
  hot_rise: number
  id: string
  name: string
}

interface PlateListProps {
  data: PlateDataType[]
  onRowClick: (row: PlateDataType) => void
}

const PlateList = (props: PlateListProps) => {
  const [sort, setSort] = useImmer<{ type?: string, order?: 'asc' | 'desc' }>({
    type: undefined,
    order: undefined
  })

  const data = useMemo(() => {
    if (!sort.type) return [...props.data]
    const newData = [...props.data]
    newData.sort((a, b) => {
      const aValue = a[sort.type as keyof PlateDataType]
      const bValue = b[sort.type as keyof PlateDataType]
      if (aValue > bValue) return sort.order === 'asc' ? 1 : -1
      if (aValue < bValue) return sort.order === 'asc' ? -1 : 1
      return 0
    })

    return newData

  }, [props.data, sort])

  const column = useMemo<JknTableProps<PlateDataType>['columns']>(() => [
    { header: '序号', enableSorting: false, accessorKey: 'index', meta: { align: 'center', width: 60 }, cell: ({ row }) => row.index + 1 },
    { header: '行业', enableSorting: false, accessorKey: 'name' },
    {
      header: '涨跌幅', accessorKey: 'change',
      meta: { width: 80 },
      cell: ({ row }) => <NumSpan block percent value={row.original.change} isPositive={row.original.change > 0} />
    },
    {
      header: '成交额', accessorKey: 'amount',
      meta: { align: 'right' },
      cell: ({ row }) => priceToCnUnit(row.original.amount)
    }
  ], [])
  return (
    <JknTable onRowClick={props.onRowClick} columns={column} data={data} onSortingChange={(s) => setSort(d => { d.type = s.id; d.order = s.desc ? 'desc' : 'asc' })} />
  )
}

interface PlateStocksProps {
  plateId?: number
}

export type PlateStockTableDataType = {
  code: string
  name: string
  price?: number
  // 涨跌幅
  percent?: number
  // 成交额
  amount?: number
  // 总市值
  total?: number
  // 换手率
  turnoverRate?: number
  // 市盈率
  pe?: number
  // 市净率
  pb?: number
  collect: 1 | 0
}
const PlateStocks = (props: PlateStocksProps) => {
  const plateStocks = useRequest(getPlateStocks, {
    cacheKey: getPlateStocks.cacheKey,
    manual: true,
  })
  const stock = useStock()

  useUpdateEffect(() => {
    if (!props.plateId) return
    plateStocks.run(props.plateId, ['alarm_ai', 'alarm_all', 'collect', 'day_basic', 'total_share', 'financials'])
  }, [props.plateId])

  const data = useMemo(() => {
    const r: PlateStockTableDataType[] = []

    if (!plateStocks.data) return r

    for (const { stock: _stock, name, symbol, extend } of plateStocks.data) {
      const lastData = stock.getLastRecordByTrading(symbol, 'intraDay')
      r.push({
        code: symbol,
        name: name,
        price: lastData?.close,
        percent: lastData?.percent,
        total: lastData?.marketValue,
        amount: lastData?.turnover,
        turnoverRate: lastData?.turnOverRate,
        pe: lastData?.pe,
        pb: lastData?.pb,
        collect: extend.collect as 0 | 1
      })
    }

    return r

  }, [plateStocks.data, stock])




  const columns = useMemo<JknTableProps<PlateStockTableDataType>['columns']>(() => [
    { header: '序号', enableSorting: false, accessorKey: 'index', meta: { align: 'center', width: 60, }, cell: ({ row }) => row.index + 1 },
    {
      header: '名称代码', accessorKey: 'name', meta: { align: 'left', },
      cell: ({ row }) => (
        <StockView name={row.getValue('name')} code={row.original.code as string} />
      )
    },
    {
      header: '现价', accessorKey: 'price', meta: { align: 'right', },
      cell: ({ row }) => (
        <NumSpan value={numToFixed(row.getValue<number>('price')) ?? 0} isPositive={row.getValue<number>('percent') >= 0} />
      )
    },
    {
      header: '涨跌幅', accessorKey: 'percent', meta: { align: 'right', },
      cell: ({ row }) => (
        <NumSpan percent block decimal={2} value={row.getValue<number>('percent') * 100} isPositive={row.getValue<number>('percent') >= 0} symbol />
      )
    },
    {
      header: '成交额', accessorKey: 'amount', meta: { align: 'right', },
      cell: ({ row }) => priceToCnUnit(row.getValue<number>('amount'))
    },
    {
      header: '总市值', accessorKey: 'total', meta: { align: 'right', },
      cell: ({ row }) => priceToCnUnit(row.getValue<number>('total'))
    },
  ], [])
  return (
    <div>
      <JknTable
        rowKey="code"
        columns={columns}
        data={data}
      // onSortingChange={(s) => setSort(d => { d.type = s.id; d.order = s.desc ? 'desc' : 'asc' })} 
      />
    </div>

  )
}

export default FirstStep