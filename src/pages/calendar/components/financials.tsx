import { getStockFinancials } from '@/api'
import {
  Button,
  CollectStar,
  JknDatePicker,
  JknIcon,
  JknRcTable,
  type JknRcTableProps,
  StockView,
  SubscribeSpan
} from '@/components'
import { useTableData, useTableRowClickToStockTrading } from '@/hooks'
import { stockUtils } from '@/utils/stock'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import { useCallback, useEffect, useMemo, useState } from 'react'

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
const StockFinancials = () => {
  const [active, setActive] = useState<string>()
  const [dates, setDates] = useState<string[]>([])

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
    if (!active && query.data?.dates?.length) {
      setActive(query.data.dates[0])
      setDates(query.data.dates)
    }
  }, [query.data?.dates, active])

  const [data, { onSort, setList }] = useTableData<TableDataType>([], {
    sort: useCallback((d: TableDataType[], k: keyof TableDataType, order: 'asc' | 'desc') => {
      if (k !== 'date') return
      const _d = [...d]
      _d.sort((a, b) => {
        const [aDate, aPeriod] = a.date.split(' ')
        const [bDate, bPeriod] = b.date.split(' ')

        if (aDate !== bDate) {
          return order === 'desc' ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate)
        }
 
        if (aPeriod !== bPeriod) {
          const a = aPeriod === '盘前' ? 3 : aPeriod === '盘后' ? 2 : 1
          const b = bPeriod === '盘前' ? 3 : bPeriod === '盘后' ? 2 : 1
          return order === 'desc' ? a - b : b - a
        }

        return (b.total ?? 0) - (a.total ?? 0)
      })

      return _d
    }, [])
  })

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
        date: `${date} ${time}`,
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

    setList(r)
  }, [query.data?.items, setList])

  const columns: JknRcTableProps<TableDataType>['columns'] = useMemo(
    () => [
      {
        title: '',
        dataIndex: 'collect',
        align: 'center',
        width: '4%',
        render: (_, row) => <CollectStar checked={row.collect === 1} code={row.code} />
      },
      {
        title: '',
        dataIndex: 'index',
        align: 'center',
        width: '4%',
        render: (_, _row, index) => <span>{index + 1}</span>
      },
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
            symbol={row.code}
            subscribe={true}
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
            symbol={row.code}
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
        render: (_: any, row) => (
          <SubscribeSpan.TurnoverBlink
            trading="intraDay"
            symbol={row.code}
            decimal={2}
            initValue={row.turnover}
            showColor={false}
          />
        )
      },
      {
        title: '总市值',
        dataIndex: 'total',
        align: 'left',
        width: '13.5%',
        sort: true,
        render: (_: any, row) => (
          <SubscribeSpan.MarketValueBlink
            trading="intraDay"
            symbol={row.code}
            initValue={row.total}
            decimal={2}
            totalShare={0}
            showColor={false}
          />
        )
      },
      {
        title: '财报时间',
        dataIndex: 'date',
        align: 'right',
        sort: true,
        render: (_: any, row) => <span className="text-[#808080]">{row.date.slice(5)}</span>
      }
    ],
    []
  )

  const onRowClick = useTableRowClickToStockTrading('code')

  return (
    <div className="h-full flex flex-col stock-calendar">
      <div className="flex items-center pt-5 pl-2">
        <JknDatePicker onChange={v => v && setActive(v)}>
          <Button variant="outline" className="h-8 px-2 text-base border-[#2E2E2E] text-[#808080]">
            {dayjs(active).format('MM-DD W')}
            <JknIcon.Svg name="arrow-down" size={8} color="#808080" />
          </Button>
        </JknDatePicker>
      </div>

      <div className="flex-1 overflow-hidden">
        <JknRcTable
          headerHeight={61}
          onSort={onSort}
          isLoading={query.isLoading}
          onRow={onRowClick}
          rowKey="id"
          columns={columns}
          data={data}
        />
      </div>

      <style jsx global>
        {`
        .stock-calendar .rc-table th {
          padding-top: 20px;
          padding-bottom: 20px;
          border: none;
        }
        .stock-calendar .rc-table td {
          border: none;
          height: 50px;
          padding-top: 0;
          padding-bottom: 0;
        }
      `}
      </style>
    </div>
  )
}

export default StockFinancials
