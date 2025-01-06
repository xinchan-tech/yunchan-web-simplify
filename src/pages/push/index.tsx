import { getStockPush, StockPushType } from "@/api"
import { CapsuleTabs, CollectStar, JknRcTable, JknRcTableProps, NumSpan, StockView } from "@/components"
import { useTableData } from "@/hooks"
import { dateToWeek } from "@/utils/date"
import { stockManager, StockRecord } from "@/utils/stock"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import Decimal from "decimal.js"
import { useEffect, useMemo, useState } from "react"



type TableDataType = StockRecord & {
  star: string
  update_time: string
}

const PushPage = () => {
  const [activeType, setActiveType] = useState<StockPushType>(StockPushType.STOCK_KING)
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [list, { setList, onSort }] = useTableData<TableDataType>([], 'symbol')

  const queryParams: Parameters<typeof getStockPush>[0] = {
    type: activeType,
    date,
    extend: ['financials', 'total_share', 'collect', 'basic_index']
  }

  const query = useQuery({
    queryKey: [getStockPush.cacheKey, queryParams],
    queryFn: () => getStockPush(queryParams),
  })

  useEffect(() => {
    if (query.data) {
      setList(query.data.map(item => {
        const [stock] = stockManager.toStockRecord(item)
        stock.update_time = item.update_time
        stock.star = item.star
        return stock as TableDataType
      }))
    }
  }, [query.data, setList])

  const dates = useMemo(() => {
    const current = dayjs().format('YYYY-MM-DD')
    const r = []

    for (let i = 0; i < 7; i++) {
      const d = dayjs(current).subtract(i, 'day')
      if (d.day() === 0 || d.day() === 6) {
        continue
      }

      r.unshift(d.format('YYYY-MM-DD'))
    }

    return r

  }, [])

  const columns = useMemo(() => {
    const common: JknRcTableProps<TableDataType>['columns'] = [
      { title: '序号', dataIndex: 'index', width: 60, render: (_, __, i) => i + 1 },
      {
        title: '名称代码',
        dataIndex: 'symbol',
        align: 'left',
        render: (_, row) => <StockView code={row.symbol} name={row.name} />
      },
      {
        title: '现价',
        dataIndex: 'close',
        align: 'right',
        sort: true,
        render: (v, row) => <NumSpan value={v} isPositive={row.isUp} decimal={3} />
      },
      {
        title: '涨跌幅%',
        dataIndex: 'percent',
        align: 'right',
        sort: true,
        render: v => <div className="inline-block">
          <NumSpan block className="w-20" value={Decimal.create(v).mul(100)} isPositive={v >= 0} percent symbol />
        </div>
      },
      {
        title: '成交额',
        dataIndex: 'turnover',
        align: 'right',
        sort: true,
        render: v => Decimal.create(v).toShortCN(2)
      },
      {
        title: '总市值',
        dataIndex: 'marketValue',
        align: 'right',
        sort: true,
        render: v => Decimal.create(v).toShortCN(2)
      },
      {
        title: '行业板块',
        dataIndex: 'industry',
        align: 'right',
        render: v => v || '-'
      },
      {
        title: '推荐指数',
        dataIndex: 'star',
        align: 'right',
        sort: true,
        render: v => v
      },
      {
        title: '更新时间',
        dataIndex: 'update_time',
        align: 'right',
        render: v => v ? `${dayjs(v).format('MM-DD')} ${dateToWeek(dayjs(v).format('YYYY-MM-DD'))} ${dayjs(v).format('HH:mm')}` : '-'
      },
      {
        title: '+股票金池',
        dataIndex: 'stock_pool',
        width: 80,
        render: (_, row) => <CollectStar code={row.symbol} checked={row.collect === 1} />
      }

    ]

    return common
  }, [activeType])

  return (
    <div className="flex flex-col h-full">
      <div className="border border-solid border-border py-1 px-2">
        <CapsuleTabs activeKey={activeType} onChange={v => setActiveType(v as StockPushType)}>
          <CapsuleTabs.Tab value={StockPushType.STOCK_KING} label="今日股王" />
          <CapsuleTabs.Tab value={StockPushType.COILING} label="缠论推送" />
          <CapsuleTabs.Tab value={StockPushType.MA} label="MA趋势评级" />
        </CapsuleTabs>
      </div>
      <div className="border-0 border-b border-solid border-border py-1 px-2">
        <CapsuleTabs activeKey={date} onChange={v => setDate(v)} type="text">
          {dates.map(d => (
            <CapsuleTabs.Tab key={d} value={d} label={d} />
          ))}
        </CapsuleTabs>
      </div>
      <div className="flex-1 overflow-hidden">
        <JknRcTable rowKey={(row) => `${row.symbol}_${row.update_time}`} onSort={onSort} columns={columns} data={list} isLoading={query.isLoading} />
      </div>
    </div>
  )
}

export default PushPage