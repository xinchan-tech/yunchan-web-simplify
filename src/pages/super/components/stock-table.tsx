import type { getStockSelection } from '@/api'
import {
  AiAlarm,
  CollectStar,
  JknCheckbox,
  JknIcon,
  JknRcTable,
  type JknRcTableProps,
  Star,
  StockView,
  SubscribeSpan
} from '@/components'
import { useCheckboxGroup, useTableData, useTableRowClickToStockTrading } from '@/hooks'
import { useConfig } from "@/store"
import { stockUtils } from '@/utils/stock'
import { cn } from '@/utils/style'
import { nanoid } from 'nanoid'
import { useEffect, useMemo } from 'react'

type TableDataType = {
  index: number
  symbol: string
  name: string
  stock_cycle: number
  indicator_name: string
  close?: number
  percent?: number
  bottom?: string
  total?: number
  amount?: number
  industry?: string
  prePercent: number
  afterPercent: number
  score_total: number
  collect: 1 | 0
  key: string
  bull: string
}

interface StockTableProps {
  data: Awaited<ReturnType<typeof getStockSelection>>
  onUpdate?: () => void
}
const StockTable = (props: StockTableProps) => {
  const [list, { setList, onSort }] = useTableData<TableDataType>([], 'symbol')
  useEffect(() => {
    if (!props.data) {
      setList([])
      return
    }

    let index = 0
    setList(
      props.data.map(item => {
        const lastData = stockUtils.toStock(item.stock, { extend: item.extend, symbol: item.symbol, name: item.name })
        const beforeData = stockUtils.toStock(item.extend?.stock_before, {
          extend: item.extend,
          symbol: item.symbol,
          name: item.name
        })
        const afterData = stockUtils.toStock(item.extend?.stock_after, {
          extend: item.extend,
          symbol: item.symbol,
          name: item.name
        })
        return {
          index: index++,
          key: nanoid(),
          bull: item.bull,
          stock_cycle: item.stock_cycle,
          indicator_name: item.indicator_name,
          symbol: lastData.symbol,
          name: lastData.name,
          close: lastData.close,
          score_total: item.score_total,
          percent: stockUtils.getPercentUnsafe(lastData),
          total: stockUtils.getMarketValue(lastData),
          amount: lastData.turnover,
          industry: lastData.industry,
          bottom: item.indicator_name_hdly,
          prePercent: stockUtils.getPercentUnsafe(beforeData),
          afterPercent: stockUtils.getPercentUnsafe(afterData),
          collect: lastData.extend?.collect ?? 0
        }
      })
    )
  }, [props.data, setList])

  const columns: JknRcTableProps<TableDataType>['columns'] = useMemo(
    () => [
      {
        title: '名称代码',
        dataIndex: 'name',
        width: 130,
        align: 'left',
        sort: true,
        render: (name, row) => (
          <div className="flex items-center space-x-2">
            <CollectStar onUpdate={props.onUpdate} checked={row.collect === 1} code={row.symbol} />
            <StockView name={name} code={row.symbol} showName />
          </div>
        )
      },
      {
        title: '周期',
        dataIndex: 'stock_cycle',
        width: 90,
        align: 'center',
        sort: true,
        render: stock_cycle => stockUtils.intervalToStr(stock_cycle)
      },
      {
        title: '信号类型',
        dataIndex: 'indicator_name',
        width: 90,
        align: 'center',
        render: (indicator_name, row) =>
          indicator_name ? (
            <div
              className={cn(
                'justify-center flex items-center w-full',
                row.bull === '1' ? 'text-stock-up' : 'text-stock-down'
              )}
            >
              {indicator_name}
            </div>
          ) : (
            '--'
          )
      },
      {
        title: '底部类型',
        dataIndex: 'bottom',
        width: 90,
        align: 'center',
        sort: true,
        render: bottom => <span>{bottom ? <span className="text-stock-up">{bottom}</span> : '--'}</span>
      },

      {
        title: '现价/涨跌幅',
        dataIndex: 'close',
        width: 140,
        align: 'left',
        sort: true,
        render: (close, row) => (
          <>
            <SubscribeSpan.PriceBlink
              trading="intraDay"
              symbol={row.symbol}
              initValue={close}
              showColor={false}
              decimal={2}
              initDirection={(row.percent ?? 0) > 0}
            />
            &nbsp;&nbsp;
            <SubscribeSpan.PercentBlink
              trading="intraDay"
              className="text-xs"
              symbol={row.symbol}
              decimal={2}
              showSign
              initValue={row.percent}
              initDirection={(row.percent ?? 0) >= 0}
              nanText="--"
            />
          </>
        )
      },
      {
        title: '总市值',
        dataIndex: 'total',
        width: 100,
        align: 'left',
        sort: true,
        render: (total, row) => (
          <SubscribeSpan.TurnoverBlink
            trading="intraDay"
            symbol={row.symbol}
            decimal={2}
            initValue={total}
            showColor={false}
          />
        )
      },
      {
        title: '信号强度',
        dataIndex: 'score_total',
        align: 'center',
        width: 100,
        sort: true,
        render: (score, row) => <Star.Rect total={5} count={score} activeColor={useConfig.getState().getStockColor(row.bull === '1', 'hex')} />
      }
    ],
    [props.onUpdate]
  )

  // const onRowClick = useTableRowClickToStockTrading('symbol')

  return <JknRcTable rowKey="key" columns={columns} data={list} onRow={(r) => ({
    onClick: () => {
      stockUtils.gotoStockPage(r.symbol, {
        interval: r.stock_cycle
      })
    }
  })} onSort={onSort} />
}

export default StockTable
