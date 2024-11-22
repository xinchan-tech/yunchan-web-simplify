import { getPlateList, getPlateStocks, getRecommendIndex, getStockCollects, type StockExtend } from "@/api"
import { Checkbox, JknIcon, JknTable, NumSpan, ScrollArea, StockView, ToggleGroup, ToggleGroupItem, type JknTableProps } from "@/components"
import { useCollectCates, useStock } from "@/store"
import { numToFixed, priceToCnUnit } from "@/utils/price"
import { cn } from "@/utils/style"
import { useMount, useUnmount, useUpdateEffect } from "ahooks"
import { useContext, useMemo, useRef, useState } from "react"
import { useImmer } from "use-immer"
import { useQuery } from '@tanstack/react-query'
import type { Row } from "@tanstack/react-table"
import { SuperStockContext } from "../ctx"

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
  const selection = useRef<string[]>([])
  const ctx = useContext(SuperStockContext)

  useMount(() => {
    refresh()
    ctx.register('collect', 1, () => [...selection.current], () => selection.current.length > 0)
  })

  useUnmount(() => {
    ctx.unregister('collect')
    selection.current = []
  })

  const _onSelect: JknTableProps['onSelection'] = (e) => {
    selection.current = e
  }

  const columns: JknTableProps<{ name: string, id: string }>['columns'] = [
    {
      header: () => <JknIcon name="checkbox_mult_nor_dis" />,
      accessorKey: 'select',
      id: 'select',
      enableSorting: false,
      meta: { align: 'center', width: 40 },
      cell: ({ row }) => (
        <div className="flex items-center justify-center w-full"><Checkbox checked={row.getIsSelected()} onCheckedChange={(e) => row.toggleSelected(e as boolean)} /></div>
      ),
    },
    {
      header: '序号',
      accessorKey: 'index',
      enableSorting: false,
      meta: { align: 'center', width: 40 },
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
      <JknTable rowKey="id" onSelection={_onSelect} onRowClick={(r, row) => { row.toggleSelected(); props.onChange?.(+r.id) }} data={collects} columns={columns} />
    </ScrollArea>
  )

}

interface GoldenPoolListProps {
  cateId: number
}
const GoldenPoolList = (props: GoldenPoolListProps) => {
  const query = useQuery({
    queryKey: [getStockCollects.cacheKey, props.cateId],
    queryFn: () => getStockCollects({ cate_id: props.cateId, extend: baseExtends, limit: 300 }),
    enabled: !!props.cateId
  })

  const stock = useStock()


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
      <JknTable rowKey="code" columns={columns} data={data} />
    </ScrollArea>
  )
}


const RecommendIndex = () => {
  const ctx = useContext(SuperStockContext)
  const data = ((ctx.data?.stock_range?.children?.t_recommend.from_datas) ?? []) as unknown as { name: string; value: string }[]
  const selection = useRef<string[]>([])

  useMount(() => {
    ctx.register('recommend', 1, () => [...selection.current], () => selection.current.length > 0)
  })

  useUnmount(() => {
    ctx.unregister('recommend')
    selection.current = []
  })


  return (
    <ToggleGroup onValueChange={(value) => { selection.current = value }} type="multiple" className="grid grid-cols-3 gap-4 p-4">
      {data?.map((child) => (
        child.name !== '' ? (
          <ToggleGroupItem className="w-full h-full" key={child.value} value={child.value}>
            {child.name}
          </ToggleGroupItem>
        ) : null
      ))}
    </ToggleGroup>
  )
}

//板块组件
const Plate = (props: { type: 1 | 2 }) => {
  const [activePlate, setActivePlate] = useState<string>()

  const plate = useQuery({
    queryKey: [getPlateList.cacheKey, props.type],
    queryFn: () => getPlateList(props.type),
    placeholderData: [],
  })

  useUpdateEffect(() => {
    setActivePlate(undefined)
    if (plate.data && plate.data.length > 0) {
      setActivePlate(plate.data[0].id)
    }
  }, [plate.data, activePlate])

  const onClickPlate = (row: PlateDataType) => {
    setActivePlate(row.id)
  }

  return (
    <div className="flex overflow-hidden h-full">
      <div className="w-[40%]">
        <ScrollArea className="h-full">
          <PlateList data={plate.data ?? []} onRowClick={onClickPlate} />
        </ScrollArea>
      </div>
      <div className="w-[60%]">
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

  const ctx = useContext(SuperStockContext)
  const selection = useRef<string[]>([])

  useMount(() => {
    ctx.register('sectors', 1, () => [...selection.current], () => selection.current.length > 0)
  })

  useUnmount(() => {
    ctx.unregister('sectors')
    selection.current = []
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

  const _onRowClick = (data: PlateDataType, row: Row<PlateDataType>) => {
    props.onRowClick(data)
    row.toggleSelected()
  }

  const column = useMemo<JknTableProps<PlateDataType>['columns']>(() => [
    {
      header: () => <JknIcon name="checkbox_mult_nor_dis" />,
      enableSorting: false,
      accessorKey: 'select',
      id: 'select',
      meta: { align: 'center', width: 30 },
      cell: ({ row }) => (
        <div className="w-full flex justify-center">
          <Checkbox checked={row.getIsSelected()} onCheckedChange={(e) => row.getToggleSelectedHandler()({ target: e })} />
        </div>
      )
    },
    { header: '序号', enableSorting: false, accessorKey: 'index', meta: { align: 'center', width: 40 }, cell: ({ row }) => row.index + 1 },
    {
      header: '行业', enableSorting: false, accessorKey: 'name', meta: { width: 'auto' },
      cell: ({ row }) => <div className="w-full overflow-hidden text-ellipsis whitespace-nowrap">{row.getValue('name')}</div>
    },
    {
      header: '涨跌幅', accessorKey: 'change',
      meta: { width: 120 },
      cell: ({ row }) => <NumSpan block percent value={row.original.change} isPositive={row.original.change > 0} />
    },
    {
      header: '成交额', accessorKey: 'amount',
      meta: { align: 'right', width: 90 },
      cell: ({ row }) => priceToCnUnit(row.original.amount, 2)
    }
  ], [])
  return (
    <JknTable onSelection={v => { selection.current = v }} onRowClick={_onRowClick} columns={column} data={data} onSortingChange={(s) => setSort(d => { d.type = s.id; d.order = s.desc ? 'desc' : 'asc' })} />
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
  const plateStocks = useQuery({
    queryKey: [getPlateStocks.cacheKey, props.plateId],
    queryFn: () => getPlateStocks(props.plateId!, ['basic_index', 'stock_before', 'stock_after', 'total_share']),
    enabled: !!props.plateId
  })

  const stock = useStock()

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
      header: '名称代码', accessorKey: 'name', meta: { align: 'left', width: 'auto' },
      cell: ({ row }) => (
        <StockView name={row.getValue('name')} code={row.original.code as string} />
      )
    },
    {
      header: '现价', accessorKey: 'price', meta: { align: 'right', width: 'auto' },
      cell: ({ row }) => (
        <NumSpan value={numToFixed(row.getValue<number>('price')) ?? 0} isPositive={row.getValue<number>('percent') >= 0} />
      )
    },
    {
      header: '涨跌幅', accessorKey: 'percent', meta: { align: 'right', width: 'auto' },
      cell: ({ row }) => (
        <NumSpan percent block decimal={2} value={row.getValue<number>('percent') * 100} isPositive={row.getValue<number>('percent') >= 0} symbol />
      )
    },
    {
      header: '成交额', accessorKey: 'amount', meta: { align: 'right', width: 'auto' },
      cell: ({ row }) => priceToCnUnit(row.getValue<number>('amount'))
    },
    {
      header: '总市值', accessorKey: 'total', meta: { align: 'right', width: 'auto' },
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