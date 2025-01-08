import { getStockPush, StockPushType } from "@/api"
import { AiAlarm, CapsuleTabs, CollectStar, JknCheckbox, JknIcon, JknRcTable, type JknRcTableProps, NumSpan, StockView } from "@/components"
import { useCheckboxGroup, useTableData } from "@/hooks"
import { stockUtils, type StockRecord } from "@/utils/stock"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import Decimal from "decimal.js"
import { produce } from "immer"
import { useEffect, useMemo, useState } from "react"



type TableDataType = StockRecord & {
  star: string
  update_time: string
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
}

const PushPage = () => {
  const [activeType, setActiveType] = useState<StockPushType>(StockPushType.STOCK_KING)
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
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
        const [stock] = stockUtils.toStockRecord(item)
        stock.update_time = item.update_time
        stock.star = item.star
        stock.id = item.id
        stock.warning = item.warning
        stock.bull = item.bull
        stock.coiling_signal = item.coiling_signal
        stock.interval = item.interval
        return stock as TableDataType
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
    queryClient.setQueryData<StockRecord[]>([getStockPush.cacheKey, queryParams], (data) => {
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
    }else{
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
        <JknRcTable rowKey="id" onSort={onSort} columns={columns} data={list} isLoading={query.isLoading} />
      </div>
    </div>
  )
}

export default PushPage