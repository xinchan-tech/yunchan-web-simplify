import { StockSelect, JknRcTable,  type JknRcTableProps, JknRangePicker, StockView, SubscribeSpan } from '@/components'
import { getStockFinancials } from '@/api'
import { useQuery } from '@tanstack/react-query'
import { useQueryParams } from '@/hooks'
import { useTableData, useTableRowClickToStockTrading } from '@/hooks'
import { useMemo, useState, useEffect } from 'react'
import Decimal from 'decimal.js'
import { stockUtils } from '@/utils/stock'

type TableDataType = {
  name: string
  code: string
  date: string
  price?: number
  percent?: number
  turnover?: number
  total?: number
  industry?: string
  prePercent?: number
  afterPercent?: number
  collect?: number
  id: string
  isUp?: boolean
}

const HistoryList = () => {
  const [active, setActive] = useState<string>()
  const [total, setTotal] = useState<number>(0)
  const [dates, setDates] = useState<string[]>([])
  const [data, { onSort, setList }] = useTableData<TableDataType>([])

  const [queryParams, setQueryParams] = useQueryParams<{ symbol: string }>()
  const onRowClick = useTableRowClickToStockTrading('code')

  const query = useQuery({
    queryKey: [getStockFinancials.cacheKey, active === dates[0] ? undefined : active],
    queryFn: () =>
      getStockFinancials({
        'date[0]': active,
        'date[1]': active,
        limit: 300,
        extend: ['basic_index', 'financials', 'stock_before', 'stock_after', 'total_share', 'collect']
      })
  })


  useEffect(() => {
    if (query.data?.dates?.length) {
      setActive(query.data.dates[0])
      setDates(query.data.dates)
    }
  }, [query.data?.dates, active])

  useEffect(() => {
    const r: TableDataType[] = []
    if (!query.data?.items) {
      setList([])
      return
    }

    for (const { id, time, date, ...stock } of query.data.items) {
      const lastStock = stockUtils.toStockWithExt(stock.stock, {
        extend: stock.extend,
        name: stock.name,
        symbol: stock.symbol
      })
      const beforeStock = stockUtils.toStockWithExt(stock.extend?.stock_before, {
        extend: stock.extend,
        name: stock.name,
        symbol: stock.symbol
      })
      const afterStock = stockUtils.toStockWithExt(stock.extend?.stock_after, {
        extend: stock.extend,
        name: stock.name,
        symbol: stock.symbol
      })

      r.push({
        name: lastStock.name,
        code: lastStock.symbol,
        id,
        date: `${date.substring(5, 10)} ${time}`,
        price: lastStock?.close || undefined,
        percent: lastStock?.percent && lastStock.percent,
        turnover: lastStock?.turnover || undefined,
        total: lastStock?.marketValue || undefined,
        industry: lastStock?.industry,
        prePercent: beforeStock?.percent,
        afterPercent: afterStock?.percent,
        collect: lastStock?.extend?.collect,
        isUp: stockUtils.isUp(lastStock)
      })
    }
    console.log('r', r)
    setList(r)
    setTotal(r.length)
  }, [query.data?.items, setList])

  const columns: JknRcTableProps<TableDataType>['columns'] = useMemo(
    () => [
      {
        title: '名称代码',
        dataIndex: 'code',
        align: 'left',
        width: '25%',
        sort: true,
        render: (_, row) => (
          <div className="flex items-center h-[33px]">
            <StockView name={row.name} code={row.code as string} showName />
          </div>
        )
      },

      {
        title: '现价',
        dataIndex: 'price',
        align: 'left',
        width: '13.5%',
        sort: true,
        render: (_: any, row) => (
          <SubscribeSpan.Price
            showColor={false}
            symbol=""
            subscribe={false}
            initValue={row.price}
            decimal={3}
            initDirection={row.isUp}
            zeroText="--"
          />
        )
      },
      {
        title: '涨跌幅',
        dataIndex: 'percent',
        align: 'left',
        width: '13%',
        sort: true,
        render: (_: any, row) => (
          <SubscribeSpan.PercentBlink
            symbol=""
            subscribe={false}
            decimal={2}
            initValue={row.percent}
            initDirection={row.isUp}
            nanText="--"
          />
        )
      },
      {
        title: '成交额',
        dataIndex: 'turnover',
        align: 'left',
        width: '13.5%',
        sort: true,
        render: (_: any, row) => Decimal.create(row.turnover).toShortCN(3)
      },
      {
        title: '总市值',
        dataIndex: 'total',
        align: 'left',
        width: '13.5%',
        sort: true,
        render: (_: any, row) => Decimal.create(row.total).toShortCN(3)
      },
      {
        title: '财报时间',
        dataIndex: 'date',
        align: 'right',
        sort: true,
        render: (_: any, row) => <span className="text-[#808080]">{row.date}</span>
      }
    ],
    []
  )

  const onDateChange = (start: string, end: string) => {
    console.log('start', start, end)
  }

  return <div className="border-[1px] border-solid border-[#3c3c3c] rounded-md pt-6 px-[2px] box-border w-full">
    <div className="flex justify-between items-center px-6 box-border">
      <div className="border-[1px] border-solid border-[#3c3c3c] rounded-lg w-[10rem] p-1.5 box-border text-[#B8B8B8] text-base">投资组合股票 {total}只</div>
      {/* <JknDatePicker onChange={v => v && setActive(v)}>
          <Button variant="outline" className="h-8 px-2 text-base border-[#2E2E2E] text-[#808080]">
            {dayjs(active).format('MM-DD W')}
            <JknIcon.Svg name="arrow-down" size={8} color="#808080" />
          </Button>
        </JknDatePicker> */}
      <div className='flex align-center'>
        <div className="flex items-center mr-6">
          <JknRangePicker allowClear onChange={onDateChange} placeholder={["开始时间", "截止时间"]} />
        </div>
        <StockSelect placeholder="查询" className='rounded-lg' width="18.75rem" onChange={v => setQueryParams(v)} />
      </div>
    </div>

    <div className="overflow-auto h-full pb-10 box-border">
      <JknRcTable
        headerHeight={61}
        onSort={onSort}
        isLoading={query.isLoading}
        className='box-border pb-5'
        // onRow={onRowClick}
        rowKey="id"
        columns={columns}
        data={data}
      />
    </div>
  </div>
}

export default HistoryList