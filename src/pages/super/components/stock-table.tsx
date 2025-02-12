import type { getStockSelection } from '@/api'
import {
  AiAlarm,
  CollectStar,
  JknCheckbox,
  JknIcon,
  JknRcTable,
  type JknRcTableProps,
  StockView,
  SubscribeSpan
} from '@/components'
import { useCheckboxGroup, useTableData, useTableRowClickToStockTrading } from '@/hooks'
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

  const { checked, onChange, setCheckedAll, getIsChecked } = useCheckboxGroup([])

  const columns: JknRcTableProps<TableDataType>['columns'] = useMemo(
    () => [
      { title: '序号', dataIndex: 'index', width: 40, align: 'center', render: (_, row) => row.index + 1 },
      {
        title: '名称代码',
        dataIndex: 'name',
        width: 120,
        align: 'left',
        sort: true,
        render: (name, row) => <StockView name={name} code={row.symbol} />
      },
      {
        title: '周期',
        dataIndex: 'stock_cycle',
        width: 40,
        align: 'right',
        sort: true,
        render: stock_cycle => `${stock_cycle}分`
      },
      {
        title: '信号类型',
        dataIndex: 'indicator_name',
        width: 120,
        align: 'center',
        render: (indicator_name, row) =>
          indicator_name ? (
            <div
              className={cn(
                'justify-center flex items-center w-full',
                row.bull === '1' ? 'text-stock-up' : 'text-stock-down'
              )}
            >
              <JknIcon.Arrow direction={row.bull === '1' ? 'up' : 'down'} className="w-3 h-3 mb-1" />
              {indicator_name}
            </div>
          ) : (
            '--'
          )
      },
      {
        title: '底部类型',
        dataIndex: 'bottom',
        width: 60,
        align: 'center',
        sort: true,
        render: bottom => <span>{bottom ? <span className="text-stock-up">{bottom}</span> : '--'}</span>
      },
      {
        title: '现价',
        dataIndex: 'close',
        width: 80,
        align: 'right',
        sort: true,
        render: (close, row) => (
          <SubscribeSpan.PriceBlink
            trading="intraDay"
            symbol={row.symbol}
            initValue={close}
            decimal={2}
            initDirection={(row.percent ?? 0) > 0}
          />
        )
      },
      {
        title: '涨跌幅',
        dataIndex: 'percent',
        width: 90,
        align: 'right',
        sort: true,
        render: (percent, row) => (
          <SubscribeSpan.PercentBlockBlink
            trading="intraDay"
            symbol={row.symbol}
            decimal={2}
            initValue={percent}
            initDirection={(row.percent ?? 0) >= 0}
            nanText="--"
          />
        )
      },
      {
        title: '成交额',
        dataIndex: 'amount',
        width: 100,
        align: 'right',
        sort: true,
        render: (amount, row) => (
          <SubscribeSpan.TurnoverBlink
            trading="intraDay"
            symbol={row.symbol}
            decimal={2}
            initValue={amount}
            showColor={false}
          />
        )
      },
      {
        title: '总市值',
        dataIndex: 'total',
        width: 100,
        align: 'right',
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
        title: '所属行业',
        dataIndex: 'industry',
        width: 120,
        align: 'right'
      },
      {
        title: '盘前涨跌幅',
        dataIndex: 'prePercent',
        width: '15%',
        align: 'right',
        sort: true,
        render: (prePercent, row) => (
          <SubscribeSpan.PercentBlink
            trading="preMarket"
            symbol={row.symbol}
            decimal={2}
            initValue={prePercent}
            initDirection={(row.percent ?? 0) >= 0}
            nanText="--"
          />
        )
      },
      {
        title: '盘后涨跌幅',
        dataIndex: 'afterPercent',
        width: '15%',
        align: 'right',
        sort: true,
        render: (afterPercent, row) => (
          <SubscribeSpan.PercentBlink
            trading="afterHours"
            symbol={row.symbol}
            decimal={2}
            initValue={afterPercent}
            initDirection={(row.percent ?? 0) >= 0}
            nanText="--"
          />
        )
      },
      {
        title: '+股票金池',
        dataIndex: 'collect',
        width: 60,
        align: 'center',
        render: (collect, row) => (
          <div>
            <CollectStar onUpdate={props.onUpdate} checked={collect} code={row.symbol} />
          </div>
        )
      },
      {
        title: '+AI报警',
        dataIndex: 't9',
        width: 50,
        align: 'center',
        render: (_, row) => (
          <AiAlarm code={row.symbol}>
            <JknIcon className="rounded-none" name="ic_add" />
          </AiAlarm>
        )
      },
      {
        title: (
          <CollectStar.Batch
            checked={checked}
            onCheckChange={v => setCheckedAll(v ? list.map(o => o.symbol) : [])}
            onUpdate={() => {
              setCheckedAll([])
            }}
          />
        ),
        dataIndex: 'check',
        id: 'select',
        width: 60,
        align: 'center',
        render: (_, row) => (
          <JknCheckbox checked={getIsChecked(row.symbol)} onCheckedChange={v => onChange(row.symbol, v)} />
        )
      }
    ],
    [checked, list, getIsChecked, onChange, setCheckedAll, props.onUpdate]
  )

  const onRowClick = useTableRowClickToStockTrading('symbol')

  return <JknRcTable rowKey="key" columns={columns} data={list} onRow={onRowClick} onSort={onSort} />
}

export default StockTable
