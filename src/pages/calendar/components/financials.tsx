import { getStockFinancials } from "@/api"
import { AiAlarm, CapsuleTabs, Checkbox, CollectStar, JknDatePicker, JknIcon, JknTable, type JknTableProps, NumSpan, Popover, PopoverAnchor, PopoverContent, StockView } from "@/components"
import { StockRecord, useCollectCates, useTime } from "@/store"
import { numToFixed, priceToCnUnit } from "@/utils/price"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useMemo, useState } from "react"

const weeks = ['日', '一', '二', '三', '四', '五', '六']

type TableDataType = {
  name: string,
  code: string,
  date: string,
  price?: number,
  percent?: number,
  turnover?: number
  total?: number,
  industry?: string,
  prePercent?: number,
  afterPercent?: number,
  collect?: number,
}
const StockFinancials = () => {
  const time = useTime()
  const usTime = time.usTime + (new Date().valueOf() - time.localStamp)
  const startDate = dayjs(usTime).tz('America/New_York').add(-1, 'day')
  const days = Array.from(new Array(8)).map((_, i) => startDate.add(i, 'day').format('YYYY-MM-DD'))
  const [active, setActive] = useState(days[0])
  const { collects } = useCollectCates()

  const query = useQuery({
    queryKey: [getStockFinancials.cacheKey, active],
    queryFn: () => getStockFinancials({
      'date[0]': active,
      'date[1]': active,
      page: 1,
      limit: 300,
      extend: ['basic_index', 'financials', 'stock_before', 'stock_after', 'total_share']
    })
  })

  const data = (() => {
    const r: TableDataType[] = []

    const { data } = query

    if (!data) return r

    for (const { symbol, name, extend, time, date, stock } of data.items) {
      const [lastStock, beforeStock, afterStock] = StockRecord.create({ stock, symbol, extend })
      r.push({
        name: name,
        code: symbol,
        date: `${date} ${time}`,
        price: lastStock?.close,
        percent: lastStock?.percent,
        turnover: lastStock?.turnover,
        total: lastStock?.marketValue,
        industry: lastStock?.industry,
        prePercent: beforeStock?.percent,
        afterPercent: afterStock?.percent,
        collect: extend?.collect,
      })
    }

    return r
  })()

  const columns: JknTableProps['columns'] = useMemo(() => [
    { header: '序号', size: 60, accessorKey: 'rank', cell: ({ row }) => row.index + 1, meta: { align: 'center' } },
    {
      header: '名称代码', accessorKey: 'name', meta: { align: 'left', width: 'full' },
      cell: ({ row }) => (
        <StockView name={row.getValue('name')} code={row.original.code as string} />
      )
    }, {
      header: '财报发布', accessorKey: 'date', meta: { align: 'right', width: 'full' },
      cell: ({ row }) => `${row.getValue('date')}`
    },
    {
      header: '现价', size: 80, accessorKey: 'price', meta: { align: 'right' },
      cell: ({ row }) => (
        <NumSpan value={numToFixed(row.getValue<number>('price')) ?? 0} isPositive={row.getValue<number>('percent') >= 0} />
      )
    },
    {
      header: '涨跌幅', size: 120, accessorKey: 'percent', meta: { align: 'right' },
      cell: ({ row }) => (
        <NumSpan percent block decimal={2} value={row.getValue<number>('percent') * 100} isPositive={row.getValue<number>('percent') >= 0} symbol />
      )
    },
    {
      header: '成交额', size: 100, accessorKey: 'turnover', meta: { align: 'right' },
      cell: ({ row }) => priceToCnUnit(row.getValue<number>('turnover'))
    },
    {
      header: '总市值', size: 100, accessorKey: 'total', meta: { align: 'right' },
      cell: ({ row }) => priceToCnUnit(row.getValue<number>('total'))
    },
    {
      header: '所属行业', size: 220, enableSorting: false, accessorKey: 'industry', meta: { align: 'right' }
    },
    {
      header: '盘前涨跌幅', size: 120, accessorKey: 'prePercent', meta: { align: 'right' },
      cell: ({ row }) => (
        <NumSpan symbol block decimal={2} percent value={row.getValue<number>('prePercent') * 100} isPositive={row.getValue<number>('prePercent') >= 0} />
      )
    },
    {
      header: '盘后涨跌幅', size: 120, accessorKey: 'afterPercent', meta: { align: 'right' },
      cell: ({ row }) => (
        <NumSpan symbol block decimal={2} percent value={row.getValue<number>('afterPercent') * 100} isPositive={row.getValue<number>('afterPercent') >= 0} />
      )
    },
    {
      header: '+股票金池', size: 80, enableSorting: false, accessorKey: 'collect', meta: { align: 'center' },
      cell: ({ row }) => (
        <div>
          <CollectStar
            // onUpdate={props.onUpdate}
            checked={row.getValue<boolean>('collect')}
            code={row.original.code as string} />
        </div>
      )
    },
    {
      header: '+AI报警', size: 80, enableSorting: false, accessorKey: 't9', meta: { align: 'center' },
      cell: ({ row }) => <AiAlarm code={row.original.code as string} ><JknIcon name="ic_add" /></AiAlarm>
    },
    {
      header: ({ table }) => (
        <div>
          <Popover open={table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()}>
            <PopoverAnchor asChild>
              <Checkbox
                checked={table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()}
                onCheckedChange={e => table.getToggleAllRowsSelectedHandler()({ target: e })}
              />
            </PopoverAnchor>
            <PopoverContent className="w-60" align="start" side="left">
              <div className="rounded">
                <div className="bg-background px-16 py-2">批量操作 {table.getSelectedRowModel().rows.length} 项</div>
                <div className="text-center px-12 py-4 space-y-4">
                  {
                    collects.map((cate) => (
                      <div key={cate.id} className="flex space-x-2 items-center">
                        <div>{cate.name}</div>
                        {/* <div onClick={() => onCreateStockToCollects(cate.id, table.getSelectedRowModel().rows.map(item => item.original.code))} onKeyDown={() => { }}>
                          <Button className="text-tertiary" size="mini" variant="outline">添加</Button>
                        </div> */}
                      </div>
                    ))
                  }
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      ),
      accessorKey: 'check',
      id: 'select',
      enableSorting: false,
      size: 40,
      meta: { align: 'center' },
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(e) => row.getToggleSelectedHandler()({ target: e })} />
      )
    }
  ], [collects])


  return (
    <div>
      <div className="py-1">
        <CapsuleTabs type="text" activeKey={active} onChange={setActive}>
          {days.map((day) => (
            <CapsuleTabs.Tab key={day} label={`${day} 星期${weeks[dayjs(day).day()]}`} value={day} />
          ))}
          <JknDatePicker onChange={(date) => date && setActive(date)}>
            {
              (date, action) => <span className="inline-block w-24" onClick={action.open} onKeyDown={() => { }}><CapsuleTabs.Tab disabled label={date ?? '自定义'} value={date ?? 'manual'} /></span>
            }
          </JknDatePicker>
        </CapsuleTabs>
      </div>
      <div>
        <JknTable.Virtualizer className="h-[calc(100vh-160px)]" rowKey="code" columns={columns} data={data} />
      </div>
    </div>
  )
}


export default StockFinancials