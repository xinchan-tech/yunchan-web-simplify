import { useMemo, useRef, useState } from "react"
import CapsuleTabs from "./components/capsule-tabs"
import { useTranslation } from "react-i18next"
import { Table } from "@/components"
import type { TableProps } from "antd"
import { useMount, useRequest, useSize } from "ahooks"
import { getIncreaseTop, IncreaseTopStatus, type StockRawRecord } from "@/api"
import { type StockRecord, useStock } from "@/store"
import { useImmer } from "use-immer"
import dayjs from "dayjs"

type TableData = {
  key: string
  code: string
  name: string
  price: number,
  percent: number,
  turnover: number,
  marketValue: number
}

const TopList = () => {
  const [type, setType] = useState<IncreaseTopStatus>(IncreaseTopStatus.PRE_MARKET)
  const { t } = useTranslation()
  const stock = useStock()
  const [codes, setCodes] = useImmer<Record<IncreaseTopStatus, [string, number][]>>({} as Record<IncreaseTopStatus, [string, number][]>)
  const tableContainer = useRef<HTMLDivElement>(null)
  const tableSize = useSize(tableContainer)

  const query = useRequest(getIncreaseTop, {
    cacheKey: 'topList',
    manual: true,
    onSuccess: (data) => {
      const _codes: [string, number][] = []
      for (const s of data) {
        const _stock = stock.createStock(s.symbol, s.name)
        // s.stock 为盘中最后一分钟数据
        s.stock[0] = dayjs(s.stock[0]).hour(15).minute(59).second(0).format('YYYY-MM-DD HH:mm:ss')
        _stock.insertForRaw(s.stock)

        _codes.push([s.symbol, s.extend?.total_share as number])

        if (s.extend) {
          if ((s.extend.stock_before as StockRawRecord).length > 0) {
            _stock.insertForRaw(s.extend?.stock_before as StockRawRecord)
          }
          if ((s.extend.stock_after as StockRawRecord).length > 0) {
            _stock.insertForRaw(s.extend?.stock_after as StockRawRecord)
          }
        }
      }

      setCodes(d => {
        d[type] = _codes
      })
    }
  })

  useMount(() => {
    query.run({ open_status: IncreaseTopStatus.PRE_MARKET, extend: ['total_share', 'stock_before', 'stock_after'] })
  })

  const onTypeChange = (s: IncreaseTopStatus) => {
    query.run({ open_status: s, extend: ['total_share', 'stock_before', 'stock_after'] })
    setType(s)
  }

  const data = useMemo(() => {
    const d: TableData[] = []

    for (const [code, totalShare] of codes[type] ?? []) {
      const _stock = stock.findStock(code)
      if (!_stock) continue
      let lastData: StockRecord | undefined
      if (type === IncreaseTopStatus.PRE_MARKET) {
        lastData = _stock?.getLastRecords('preMarket')
      } else if (type === IncreaseTopStatus.INTRA_DAY || type === IncreaseTopStatus.YESTERDAY || type === IncreaseTopStatus.WEEK) {
        lastData = _stock.getLastRecords('intraDay')
      } else if (type === IncreaseTopStatus.AFTER_HOURS) {
        lastData = _stock.getLastRecords('afterHours')
      }

      if (!lastData) continue

      d.push({
        key: _stock.getCode() + type,
        code: _stock.getCode(),
        name: _stock.getName(),
        price: lastData.close,
        percent: lastData.percent,
        turnover: lastData.turnover,
        marketValue: lastData.turnover * totalShare
      })
    }
    return d
  }, [stock, codes, type])

  const columns: TableProps<TableData>['columns'] = [
    {
      title: '名称代码', dataIndex: 'name', sorter: true, showSorterTooltip: false,
      width: '25%',
      render: (_, row) => (
        <div className="overflow-hidden w-full">
          <div className="text-secondary">{row.code}</div>
          <div className="text-tertiary text-xs text-ellipsis overflow-hidden whitespace-nowrap w-full">{row.name}</div>
        </div>
      )

    },
    { title: '盘前价', dataIndex: 'price', sorter: true, align: 'right', showSorterTooltip: false, width: '17%' },
    { title: '盘前涨跌幅', dataIndex: 'percent', sorter: true, align: 'right', showSorterTooltip: false, width: '22%' },
    { title: '成交额', dataIndex: 'turnover', sorter: true, align: 'right', showSorterTooltip: false, width: '17%' },
    { title: '总市值', dataIndex: 'marketValue', sorter: true, align: 'right', showSorterTooltip: false, width: '19%' },
  ]

  return (
    <div className="w-full h-full">
      <div className="border-style-primary px-1 py-2">
        <CapsuleTabs activeKey={type.toString()} onChange={(v) => onTypeChange(+v as IncreaseTopStatus)}>
          <CapsuleTabs.Tab value={IncreaseTopStatus.PRE_MARKET.toString()} label={<span>{`${t('stockChart.before')}热门`}</span>} />
          <CapsuleTabs.Tab value={IncreaseTopStatus.INTRA_DAY.toString()} label={<span>{`${t('stockChart.in')}热门`}</span>} />
          <CapsuleTabs.Tab value={IncreaseTopStatus.AFTER_HOURS.toString()} label={<span>{`${t('stockChart.after')}热门`}</span>} />
          <CapsuleTabs.Tab value={IncreaseTopStatus.YESTERDAY.toString()} label={<span>昨日</span>} />
          <CapsuleTabs.Tab value={IncreaseTopStatus.WEEK.toString()} label={<span>本周</span>} />
        </CapsuleTabs>
      </div>
      <div className="h-[calc(100%-38px)]" ref={tableContainer}>
        <Table rowKey="code" columns={columns} dataSource={data} key="code" sortDirections={['descend', 'ascend']} scroll={{
          y: tableSize?.height ?? 0
        }} pagination={false} />
      </div>
    </div>
  )
}

export default TopList