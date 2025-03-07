import { getStockFinancials } from '@/api'
import {
  AiAlarm,
  CapsuleTabs,
  CollectStar,
  JknCheckbox,
  JknDatePicker,
  JknIcon,
  JknRcTable,
  type JknRcTableProps,
  StockView,
  SubscribeSpan
} from '@/components'
import { useCheckboxGroup, useTableData, useTableRowClickToStockTrading } from '@/hooks'
import { stockUtils } from '@/utils/stock'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import { useEffect, useMemo, useState } from 'react'

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

  const { checked, onChange, setCheckedAll, getIsChecked } = useCheckboxGroup([])

  useEffect(() => {
    if (!active && query.data?.dates?.length) {
      setActive(query.data.dates[0])
      setDates(query.data.dates)
    }
  }, [query.data?.dates, active])

  const [data, { onSort, setList }] = useTableData<TableDataType>([])

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
        date: `a${date} ${time}`,
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
      { title: '序号', dataIndex: 'rank', render: (_: any, __, index) => index + 1, align: 'center', width: 80 },
      {
        title: '名称代码',
        dataIndex: 'code',
        align: 'left',
        sort: true,
        width: '16%',
        render: (_: any, row) => <StockView name={row.name} code={row.code as string} />
      },
      {
        title: '财报发布',
        dataIndex: 'date',
        align: 'right',
        width: '12%',
        sort: true,
        render: (_: any, row) => `${row.date.slice(1)}`
      },
      {
        title: '现价',
        size: 80,
        dataIndex: 'price',
        align: 'right',
        width: 120,
        sort: true,
        render: (_: any, row) => (
          <SubscribeSpan.Price
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
        align: 'right',
        width: 90,
        sort: true,
        render: (_: any, row) => (
          <SubscribeSpan.PercentBlock
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
        align: 'right',
        width: 120,
        sort: true,
        render: (_: any, row) => Decimal.create(row.turnover).toShortCN(3)
      },
      {
        title: '总市值',
        dataIndex: 'total',
        align: 'right',
        width: 120,
        sort: true,
        render: (_: any, row) => Decimal.create(row.total).toShortCN(3)
      },
      {
        title: '所属行业',
        enableSorting: false,
        dataIndex: 'industry',
        align: 'right',
        width: '16%',
        sort: true
      },
      {
        title: '盘前涨跌幅',
        dataIndex: 'prePercent',
        align: 'right',
        width: 90,
        sort: true,
        render: (_: any, row) => (
          <SubscribeSpan.PercentBlock
            symbol=""
            subscribe={false}
            decimal={2}
            initValue={row.prePercent}
            initDirection={row.prePercent ? row.prePercent > 0 : false}
            nanText="--"
          />
        )
      },
      {
        title: '盘后涨跌幅',
        dataIndex: 'afterPercent',
        align: 'right',
        width: 90,
        sort: true,
        render: (_: any, row) => (
          <SubscribeSpan.PercentBlock
            symbol=""
            subscribe={false}
            decimal={2}
            initValue={row.afterPercent}
            initDirection={row.afterPercent ? row.afterPercent > 0 : false}
            nanText="--"
          />
        )
      },
      {
        title: '+股票金池',
        dataIndex: 'collect',
        width: 80,
        align: 'center',
        render: (_, row) => <CollectStar checked={row.collect === 1} code={row.code} />
      },
      {
        title: '+AI报警',
        size: 80,
        enableSorting: false,
        dataIndex: 't9',
        align: 'center',
        width: 80,
        render: (_: any, row) => (
          <AiAlarm code={row.code as string}>
            <JknIcon className="rounded-none" name="ic_add" />
          </AiAlarm>
        )
      },
      {
        title: (
          <CollectStar.Batch
            checked={checked}
            onCheckChange={v => setCheckedAll(v ? data.map(o => o.code) : [])}
            onUpdate={() => {
              query.refetch()
              setCheckedAll([])
            }}
          />
        ),
        dataIndex: 'checked',
        align: 'center',
        width: 60,
        render: (_, row) => (
          <JknCheckbox checked={getIsChecked(row.code)} onCheckedChange={v => onChange(row.code, v)} />
        )
      }
    ],
    [checked, data, getIsChecked, onChange, setCheckedAll, query.refetch]
  )

  const onRowClick = useTableRowClickToStockTrading('id')

  return (
    <div className="h-full flex flex-col">
      <div className="py-1">
        <CapsuleTabs type="text" activeKey={active} onChange={setActive}>
          {dates.map(date => (
            <CapsuleTabs.Tab key={date} label={dayjs(date).format('M月D日 W')} value={date} />
          ))}
          <JknDatePicker onChange={date => date && setActive(date)}>
            {(date, action) => (
              <span className="inline-block w-24" onClick={action.open} onKeyDown={() => {}}>
                <CapsuleTabs.Tab
                  disabled
                  label={active === date ? (date ?? '自定义') : '自定义'}
                  value={date ?? 'manual'}
                />
              </span>
            )}
          </JknDatePicker>
        </CapsuleTabs>
      </div>
      <div className="flex-1 overflow-hidden">
        <JknRcTable
          onSort={onSort}
          isLoading={query.isLoading}
          onRow={onRowClick}
          rowKey="id"
          columns={columns}
          data={data}
        />
      </div>
    </div>
  )
}

export default StockFinancials
