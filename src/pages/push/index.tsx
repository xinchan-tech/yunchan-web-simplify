import { StockPushType, getStockPush } from "@/api"
import { AiAlarm, CapsuleTabs, CollectStar, JknCheckbox, JknIcon, JknRcTable, type JknRcTableProps, NumSpanSubscribe, StockView } from "@/components"
import { useCheckboxGroup, useTableData, useTableRowClickToStockTrading } from "@/hooks"
import { useTime } from "@/store"
import { type Stock, stockUtils } from "@/utils/stock"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import { produce } from "immer"
import { useEffect, useMemo, useState } from "react"



type TableDataType = Stock & {
  star: string
  update_time: string
  create_time: string
  /**
   * warning = 0, 画闪电
   * warning = 1, 画绿色火苗
   */
  warning: string
  /**
   * bull = 0, 画红色火苗
   * bull = 1, 画绿色火苗
   */
  bull: string
  /**
   * 推送周期
   */
  interval: string
  coiling_signal: string
  id: string
  percent?: number
  marketValue?: number
  
}

const PushPage = () => {
  const [activeType, setActiveType] = useState<StockPushType>(StockPushType.STOCK_KING)
  const getCurrentUsTime = useTime(s => s.getCurrentUsTime)
  const [date, setDate] = useState(dayjs(getCurrentUsTime()).format('YYYY-MM-DD'))
  const [list, { setList, onSort }] = useTableData<TableDataType>([], 'id')
  const { checked, onChange, setCheckedAll, getIsChecked } = useCheckboxGroup([])

  const queryParams: Parameters<typeof getStockPush>[0] = {
    type: activeType,
    date,
    extend: ['financials', 'total_share', 'collect', 'basic_index']
  }

  const query = useQuery({
    queryKey: [getStockPush.cacheKey, queryParams],
    queryFn: () => getStockPush(queryParams)
  })
  const queryClient = useQueryClient()

  useEffect(() => {
    if (query.data) {
      setList(query.data.map(item => {
        const stock = stockUtils.toStock(item.stock, { extend: item.extend, symbol: item.symbol, name: item.name }) as TableDataType
        stock.update_time = item.update_time
        stock.star = item.star
        stock.id = item.id
        stock.warning = item.warning
        stock.percent = stockUtils.getPercent(stock)
        stock.marketValue = stockUtils.getMarketValue(stock)
        stock.bull = item.bull
        stock.coiling_signal = item.coiling_signal
        stock.interval = item.interval
        stock.create_time = item.create_time
        return stock
      }))
    } else {
      setList([])
    }
    setCheckedAll([])
  }, [query.data, setList, setCheckedAll])

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

  const onUpdateCollect = (id: string, checked: boolean) => {
    queryClient.setQueryData<TableDataType[]>([getStockPush.cacheKey, queryParams], (data) => {
      if (!data) return data
      return data.map(produce(item => {
        if (item.id === id) {
          item.extend!.collect = checked ? 1 : 0
        }
      }))
    })
  }

  const columns = (() => {
    const common: JknRcTableProps<TableDataType>['columns'] = [
      { title: '序号', dataIndex: 'index', width: 60, render: (_, __, i) => i + 1 },
      {
        title: '名称代码',
        dataIndex: 'symbol',
        align: 'left',
        sort: true,
        render: (_, row) => <StockView code={row.symbol} name={row.name} />
      },
      {
        title: '现价',
        dataIndex: 'close',
        align: 'right',
        sort: true,
        render: (v, row) => <NumSpanSubscribe code={row.symbol} field="close" blink value={v} isPositive={stockUtils.isUp(row)} align="right" />
      },
      {
        title: '涨跌幅%',
        dataIndex: 'percent',
        align: 'right',
        sort: true,
        render: (percent, row) => <NumSpanSubscribe code={row.symbol} field="percent" blink block className="w-20" decimal={2} value={percent} percent isPositive={stockUtils.isUp(row)} symbol align="right" />
      },
      {
        title: '成交额',
        dataIndex: 'turnover',
        align: 'right',
        sort: true,
        render: (turnover, row) => <NumSpanSubscribe code={row.symbol} field="turnover" blink align="right" unit decimal={2} value={turnover} />
      },
      {
        title: '总市值',
        dataIndex: 'marketValue',
        align: 'right',
        sort: true,
        render: (marketValue, row) => <NumSpanSubscribe code={row.symbol} field={v => stockUtils.getSubscribeMarketValue(row, v)} blink align="right" unit decimal={2} value={marketValue} />
      },
      {
        title: `${activeType === StockPushType.STOCK_KING ? '股王' : '推荐'}指数`,
        dataIndex: 'star',
        align: 'right',
        sort: true,
        render: (v, row) => Array.from({ length: v }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <JknIcon key={i} name={
            activeType === StockPushType.STOCK_KING ?
              (row.warning === '0' ? 'ic_fire_green' : 'ic_flash') :
              (row.bull === '1' ? 'ic_fire_green' : 'ic_fire_red')
          } />
        ))
      },
      {
        title: '首次入选时间',
        dataIndex: 'create_time',
        align: 'center',
        sort: true,
        render: v => v ? `${dayjs(+v * 1000).tz('America/New_York').format('MM-DD W HH:mm')}` : '-'
      },
      {
        title: '更新时间',
        dataIndex: 'update_time',
        align: 'center',
        sort: true,
        render: v => v ? `${dayjs(+v * 1000).tz('America/New_York').format('MM-DD W HH:mm')}` : '-'
      },
      {
        title: '+股票金池',
        dataIndex: 'collect',
        width: 80,
        render: (_, row) => <CollectStar code={row.symbol} checked={row.extend?.collect === 1} onUpdate={(checked) => onUpdateCollect(row.id, checked)} />
      },
      {
        title: 'AI报警',
        dataIndex: 'ai',
        width: 60,
        render: (_, row) => <div className="text-center"><AiAlarm code={row.symbol}><JknIcon name="ic_add" className="rounded-none" /></AiAlarm></div>
      },
      {
        title: <CollectStar.Batch checked={checked} onCheckChange={(v) => setCheckedAll(v ? list.map(o => o.symbol) : [])} />,
        dataIndex: 'checked',
        align: 'center',
        width: 60,
        render: (_, row) => <JknCheckbox checked={getIsChecked(row.symbol)} onCheckedChange={v => onChange(row.symbol, v)} />
      }
    ]

    if (activeType === StockPushType.STOCK_KING || activeType === StockPushType.MA) {
      (common as any[]).splice(6, 0, {
        title: '行业板块',
        dataIndex: 'industry',
        align: 'right'
      })
    } else {
      (common as any[]).splice(6, 0, {
        title: '推送周期',
        dataIndex: 'interval',
        align: 'right'
      }, {
        title: '缠论信号',
        dataIndex: 'coiling_signal',
        align: 'right'
      })
    }

    return common
  })()

  const onRowClick = useTableRowClickToStockTrading('symbol')

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
            <CapsuleTabs.Tab key={d} value={d} label={dayjs(d).format('MM-DD W')} />
          ))}
        </CapsuleTabs>
      </div>
      <div className="flex-1 overflow-hidden">
        <JknRcTable rowKey="id" onSort={onSort} columns={columns} data={list} isLoading={query.isLoading} onRow={onRowClick} />
      </div>
    </div>
  )
}

export default PushPage