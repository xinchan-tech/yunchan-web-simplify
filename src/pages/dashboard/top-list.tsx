import { IncreaseTopStatus, type StockRawRecord, getIncreaseTop } from "@/api"
import { Table } from "@/components"
import { type StockRecord, useStock, useTime } from "@/store"
import { numToFixed, priceToCnUnit } from "@/utils/price"
import { cn } from "@/utils/style"
import { InfoCircleFilled } from "@ant-design/icons"
import { useMount, useRequest, useSize } from "ahooks"
import { Skeleton, type TableProps, Tooltip } from "antd"
import dayjs from "dayjs"
import { useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useImmer } from "use-immer"
import CapsuleTabs from "./components/capsule-tabs"
import { dateToWeek } from "@/utils/date"

type TableData = {
  key: string
  code: string
  name: string
  price: number,
  percent: number,
  turnover: number,
  marketValue: number,
  date: string
}

const TopList = () => {
  const [type, setType] = useState<IncreaseTopStatus>(IncreaseTopStatus.PRE_MARKET)
  const { t } = useTranslation()
  const stock = useStock()
  const trading = useTime().getTrading()
  const { isToday } = useTime()
  const [codes, setCodes] = useImmer<Record<IncreaseTopStatus, [string, number][]>>({} as Record<IncreaseTopStatus, [string, number][]>)
  const tableContainer = useRef<HTMLDivElement>(null)
  const tableSize = useSize(tableContainer)

  const query = useRequest(getIncreaseTop, {
    cacheKey: 'topList',
    manual: true,
    pollingInterval: 30 * 1000,
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
        lastData = _stock?.getLastRecord(trading === 'preMarket' ? 'preMarket' : 'intraDay')
      } else if (type === IncreaseTopStatus.INTRA_DAY || type === IncreaseTopStatus.YESTERDAY || type === IncreaseTopStatus.WEEK) {
        lastData = _stock.getLastRecord('intraDay')
      } else if (type === IncreaseTopStatus.AFTER_HOURS) {
        lastData = _stock.getLastRecord('afterHours')
      }

      if (!lastData) continue

      d.push({
        key: _stock.getCode() + type,
        code: _stock.getCode(),
        name: _stock.getName(),
        price: lastData.close,
        percent: lastData.percent,
        turnover: lastData.turnover,
        marketValue: lastData.close * totalShare,
        date: lastData.time
      })
    }
    return d
  }, [stock, codes, type, trading])

  const columns: TableProps['columns'] = [
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
    {
      title: '盘前价', dataIndex: 'price', sorter: true, align: 'right', showSorterTooltip: false, width: '17%',
      render: (v, row) => <span className={cn(row.percent >= 0 ? 'text-stock-up' : 'text-stock-down')}>
        {numToFixed(v)}
      </span>
    },
    {
      title: '盘前涨跌幅', dataIndex: 'percent', sorter: true, align: 'right', showSorterTooltip: false, width: '22%',
      render: v => (
        <div className={cn(v >= 0 ? 'bg-stock-up' : 'bg-stock-down', 'h-full rounded-sm w-16 text-center px-1 py-0.5 float-right')}>
          {v > 0 ? '+' : null}{`${numToFixed(v * 100, 2)}%`}
        </div>
      )
    },
    {
      title: '成交额', dataIndex: 'turnover', sorter: true, align: 'right', showSorterTooltip: false, width: '17%',
      render: (v, row) => <span className={cn(row.percent >= 0 ? 'text-stock-up' : 'text-stock-down')}>
        {priceToCnUnit(v * 10000, 2)}
      </span>
    },
    {
      title: '总市值', dataIndex: 'marketValue', sorter: true, align: 'right', showSorterTooltip: false, width: '19%',
      render: (v, row) => <span className={cn(row.percent >= 0 ? 'text-stock-up' : 'text-stock-down')}>
        {priceToCnUnit(v, 2)}
      </span>
    },
  ]
  // console.log(trading)
  // useEffect(() => {
  //   console.log(trading)
  // }, [trading])

  const isShowTips = () => {
    if (!data || data.length === 0) return false

    const firstRecord = data[0]
    if (isToday(firstRecord.date)) {
      if (type === IncreaseTopStatus.PRE_MARKET && ['preMarket', 'intraDay', 'afterHours'].includes(trading)) {
        return false
      }

      if (type === IncreaseTopStatus.INTRA_DAY && ['intraDay', 'afterHours'].includes(trading)) {
        return false
      }

      if (type === IncreaseTopStatus.AFTER_HOURS && ['afterHours'].includes(trading)) {
        return false
      }

      return true
    }

    return true
  }

  const formatDate = (date: string) => {
    const d = dayjs(date)
    return d.isValid() ? (` ${d.format('MM-DD')} ${dateToWeek(d)} `) : date
  }


  return (
    <div className="w-full h-full">
      <div className="border-style-primary px-1 py-2">
        <CapsuleTabs activeKey={type.toString()} onChange={(v) => onTypeChange(+v as IncreaseTopStatus)}>
          <CapsuleTabs.Tab value={IncreaseTopStatus.PRE_MARKET.toString()}
            label={<span>{`${t('stockChart.before')}热门`}&nbsp;{isShowTips() && <Tooltip title={`上一个交易日${formatDate(data[0]?.date)}统计`}><InfoCircleFilled /></Tooltip>}</span>}
          />
          <CapsuleTabs.Tab value={IncreaseTopStatus.INTRA_DAY.toString()}
            label={<span>{`${t('stockChart.in')}热门`}&nbsp;{isShowTips() && <Tooltip title={`上一个交易日${formatDate(data[0]?.date)}统计`}><InfoCircleFilled /></Tooltip>}</span>}
          />
          <CapsuleTabs.Tab value={IncreaseTopStatus.AFTER_HOURS.toString()}
            label={<span>{`${t('stockChart.after')}热门`}&nbsp;{isShowTips() && <Tooltip title={`上一个交易日${formatDate(data[0]?.date)}统计`}><InfoCircleFilled /></Tooltip>}</span>}
          />
          <CapsuleTabs.Tab value={IncreaseTopStatus.YESTERDAY.toString()} label={<span>昨日</span>} />
          <CapsuleTabs.Tab value={IncreaseTopStatus.WEEK.toString()} label={<span>本周</span>} />
        </CapsuleTabs>
      </div>
      <div className="h-[calc(100%-38px)]" ref={tableContainer}>
        <Skeleton loading={query.loading && !codes[type]} paragraph={{ rows: 10 }} active>
          <Table rowKey="code" bordered columns={columns} dataSource={data} key="code" sortDirections={['descend', 'ascend']} scroll={{
            y: tableSize?.height ? tableSize.height - 32: 0
          }} pagination={false} />
        </Skeleton>
      </div>
    </div>
  )
}

export default TopList