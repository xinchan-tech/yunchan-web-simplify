import { IncreaseTopStatus, type StockRawRecord, getIncreaseTop } from "@/api"
import { CapsuleTabs, JknTable, type JknTableProps } from "@/components"
import { type StockRecord, type StockTrading, useStock, useTime } from "@/store"
import { numToFixed, priceToCnUnit } from "@/utils/price"
import { cn } from "@/utils/style"
import { useMount, useRequest, useSize } from "ahooks"
import dayjs from "dayjs"
import { useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useImmer } from "use-immer"
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

const tradingToTopStatusMap: Record<StockTrading, IncreaseTopStatus> = {
  intraDay: IncreaseTopStatus.INTRA_DAY,
  preMarket: IncreaseTopStatus.PRE_MARKET,
  afterHours: IncreaseTopStatus.AFTER_HOURS,
  close: IncreaseTopStatus.AFTER_HOURS
}

const TopList = () => {
  const time = useTime()
  const [type, setType] = useState<IncreaseTopStatus>(tradingToTopStatusMap[time.getTrading()])
  const { t } = useTranslation()
  const stock = useStock()
  const trading = useTime().getTrading()
  const { isToday } = useTime()
  const [codes, setCodes] = useImmer<Record<IncreaseTopStatus, [string, number, string][]>>({} as Record<IncreaseTopStatus, [string, number, string][]>)
  const tableContainer = useRef<HTMLDivElement>(null)
  const tableSize = useSize(tableContainer)

  const query = useRequest(getIncreaseTop, {
    cacheKey: 'topList',
    manual: true,
    pollingInterval: 30 * 1000,
    onSuccess: (data) => {
      const _codes: [string, number, string][] = []
      for (const s of data) {
        // s.stock 为盘中最后一分钟数据
        s.stock[0] = dayjs(s.stock[0]).hour(15).minute(59).second(0).format('YYYY-MM-DD HH:mm:ss')
        stock.insertRaw(s.symbol, s.stock)

        _codes.push([s.symbol, s.extend?.total_share as number, s.name])

        if (s.extend) {
          if ((s.extend.stock_before as StockRawRecord).length > 0) {
            stock.insertRaw(s.symbol, s.extend?.stock_before as StockRawRecord)
          }
          if ((s.extend.stock_after as StockRawRecord).length > 0) {
            stock.insertRaw(s.symbol, s.extend?.stock_after as StockRawRecord)
          }
        }
      }

      setCodes(d => {
        d[type] = _codes
      })
    }
  })

  useMount(() => {
    query.run({ open_status: tradingToTopStatusMap[time.getTrading()], extend: ['total_share', 'stock_before', 'stock_after'] })
  })

  const onTypeChange = (s: IncreaseTopStatus) => {
    query.run({ open_status: s, extend: ['total_share', 'stock_before', 'stock_after'] })
    setType(s)
  }

  const data = useMemo(() => {
    const d: TableData[] = []

    for (const [code, totalShare, name] of codes[type] ?? []) {
      let lastData: StockRecord | undefined
      if (type === IncreaseTopStatus.PRE_MARKET) {
        lastData = stock.getLastRecordByTrading(code, trading === 'preMarket' ? 'preMarket' : 'intraDay')
      } else if (type === IncreaseTopStatus.INTRA_DAY || type === IncreaseTopStatus.YESTERDAY || type === IncreaseTopStatus.WEEK) {
        lastData = stock.getLastRecordByTrading(code, 'intraDay')
      } else if (type === IncreaseTopStatus.AFTER_HOURS) {
        lastData = stock.getLastRecordByTrading(code, 'afterHours')
      }

      if (!lastData) continue

      d.push({
        key: code + type,
        code: code,
        name: name,
        price: lastData.close,
        percent: lastData.percent,
        turnover: lastData.turnover,
        marketValue: lastData.close * totalShare,
        date: lastData.time
      })
    }
    return d
  }, [stock, codes, type, trading])

  const columns: JknTableProps<TableData>['columns'] = [
    {
      header: '名称代码', accessorKey: 'name',
      render: (_, row) => (
        <div className="overflow-hidden w-full">
          <div className="text-secondary">{row.code}</div>
          <div className="text-tertiary text-xs text-ellipsis overflow-hidden whitespace-nowrap w-full">{row.name}</div>
        </div>
      )

    },
    {
      header: '盘前价', accessorKey: 'price', sorter: true, align: 'right', showSorterTooltip: false, width: '17%',
      render: (v, row) => <span className={cn(row.percent >= 0 ? 'text-stock-up' : 'text-stock-down')}>
        {numToFixed(v)}
      </span>
    },
    {
      header: '盘前涨跌幅', accessorKey: 'percent', sorter: true, align: 'right', showSorterTooltip: false, width: '22%',
      render: v => (
        <div className={cn(v >= 0 ? 'bg-stock-up' : 'bg-stock-down', 'h-full rounded-sm w-16 text-center px-1 py-0.5 float-right')}>
          {v > 0 ? '+' : null}{`${numToFixed(v * 100, 2)}%`}
        </div>
      )
    },
    {
      header: '成交额', accessorKey: 'turnover', sorter: true, align: 'right', showSorterTooltip: false, width: '17%',
      render: (v, row) => <span className={cn(row.percent >= 0 ? 'text-stock-up' : 'text-stock-down')}>
        {priceToCnUnit(v * 10000, 2)}
      </span>
    },
    {
      header: '总市值', accessorKey: 'marketValue', sorter: true, align: 'right', showSorterTooltip: false, width: '19%',
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
    return false
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
        <div>
          <JknTable columns={columns} data={data} key="code"  />
        </div>
      </div>
    </div>
  )
}

export default TopList