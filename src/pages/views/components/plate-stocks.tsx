import { StockView, NumSpan, Button, JknTable, JknTableProps } from "@/components"
import { numToFixed, priceToCnUnit } from "@/utils/price"
import { Checkbox } from "@radix-ui/react-checkbox"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@radix-ui/react-hover-card"
import { Star } from "lucide-react"
import { useMemo } from "react"

export type PlateStockTableDataType = {
  code: string
  name: string
  price: number
  // 涨跌幅
  percent: number
  // 成交额
  amount: number
  // 总市值
  total: number
  // 换手率
  turnoverRate: number
  // 市盈率
  pe: number
  // 市净率
  pb: number
  collect: 1 | 0
}
const PlateStocks = () => {
  const columns = useMemo<JknTableProps<PlateStockTableDataType>['columns']>(() => [
    { header: '序号', enableSorting: false, accessorKey: 'index', meta: { align: 'center', width: 60, }, cell: ({ row }) => row.index + 1 },
    {
      header: '名称代码', accessorKey: 'name', meta: { align: 'left', width: 120 },
      cell: ({ row }) => (
        <StockView name={row.getValue('name')} code={row.original.code as string} />
      )
    },
    {
      header: '现价', accessorKey: 'price', meta: { align: 'right', width: 120 },
      cell: ({ row }) => (
        <NumSpan value={numToFixed(row.getValue<number>('price'))} isPositive={row.getValue<number>('percent') >= 0} />
      )
    },
    {
      header: '涨跌幅', accessorKey: 'percent', meta: { align: 'right', width: 120 },
      cell: ({ row }) => (
        <NumSpan percent block decimal={2} value={row.getValue<number>('percent') * 100} isPositive={row.getValue<number>('percent') >= 0} symbol />
      )
    },
    {
      header: '成交额', accessorKey: 'amount', meta: { align: 'right', width: 120 },
      cell: ({ row }) => priceToCnUnit(row.getValue<number>('amount'))
    },
    {
      header: '总市值', accessorKey: 'total', meta: { align: 'right', width: 120 },
      cell: ({ row }) => priceToCnUnit(row.getValue<number>('total'))
    },
    {
      header: '所属行业', enableSorting: false, accessorKey: 'industry', meta: { width: 120, align: 'right' }
    },
    {
      header: '盘前涨跌幅', accessorKey: 'prePercent', meta: { width: '15%', align: 'right' },
      cell: ({ row }) => (
        <NumSpan symbol decimal={2} percent value={row.getValue<number>('prePercent')} isPositive={row.getValue<number>('prePercent') >= 0} />
      )
    },
    {
      header: '盘后涨跌幅', accessorKey: 'afterPercent', meta: { width: '15%', align: 'right' },
      cell: ({ row }) => (
        <NumSpan symbol decimal={2} percent value={row.getValue<number>('afterPercent')} isPositive={row.getValue<number>('afterPercent') >= 0} />
      )
    },
    {
      header: '换手率', accessorKey: 'turnoverRate', meta: { width: '15%', align: 'right' },
      cell: ({ row }) => `${numToFixed(row.getValue<number>('turnoverRate'), 2)}%`
    },
    {
      header: '市盈率', enableSorting: false, accessorKey: 'pe', meta: { width: '15%', align: 'right' },
      cell: ({ row }) => `${numToFixed(row.getValue<number>('pe'), 2)}`
    },
    {
      header: '市净率', enableSorting: false, accessorKey: 'pb', meta: { width: '15%', align: 'right' },
      cell: ({ row }) => `${numToFixed(row.getValue<number>('pb'), 2)}`
    },
    // {
    //   header: '+股票金池', enableSorting: false, accessorKey: 'collect', meta: { width: '15%', align: 'center' },
    //   cell: ({ row }) => (
    //     <HoverCard
    //       onOpenChange={open => open && cateQuery.run(row.original.code)}
    //       openDelay={100}
    //     >
    //       <HoverCardTrigger asChild>
    //         <div><Star checked={row.getValue('collect') === 1} /></div>
    //       </HoverCardTrigger>
    //       <HoverCardContent align="center" side="left" sideOffset={-10}
    //         className="p-0 w-32"
    //       >
    //         <div className="bg-background py-2">加入金池</div>
    //         <div className="min-h-32 space-y-2">
    //           {
    //             collects.map(item => (
    //               <div key={item.id} className="flex cursor-pointer items-center justify-center space-x-4 hover:bg-primary py-1">
    //                 <Checkbox />
    //                 <span>{item.name}</span>
    //               </div>
    //             ))
    //           }
    //         </div>
    //         <div>
    //           <Button block className="rounded-none">确认</Button>
    //         </div>
    //       </HoverCardContent>
    //     </HoverCard>
    //   )
    // },
    {
      header: '+AI报警', enableSorting: false, accessorKey: 't9', meta: { width: '15%', align: 'right' }
    },
    {
      header: () => <Checkbox checked={check.all} onCheckedChange={onCheckAll} />,
      accessorKey: 'check',
      enableSorting: false,
      meta: { align: 'center', width: 60 },
      cell: ({ row }) => (
        <Checkbox checked={check.selected.includes(row.original.code)} onCheckedChange={() => onCheck(row.original.code)} />
      )
    }
  ])
  return (
    <JknTable onRowClick={props.onRowClick} columns={column} data={data} onSortingChange={(s) => setSort(d => { d.type = s.id; d.order = s.desc ? 'desc' : 'asc' })} />
  )
}

export default PlateStocks