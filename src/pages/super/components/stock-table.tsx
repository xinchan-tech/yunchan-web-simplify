import { type getStockSelection } from "@/api"
import { AiAlarm, CollectStar, JknCheckbox, JknIcon, JknRcTable, JknRcTableProps, NumSpan, NumSpanSubscribe, StockView } from "@/components"
import { useCheckboxGroup, useTableData, useTableRowClickToStockTrading } from "@/hooks"
import { stockUtils } from "@/utils/stock"
import { produce } from "immer"
import { nanoid } from "nanoid"
import { useCallback, useEffect, useMemo } from "react"

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
}

interface StockTableProps {
  data: Awaited<ReturnType<typeof getStockSelection>>
  onUpdate?: () => void
}
const StockTable = (props: StockTableProps) => {
  const [list, { setList, updateList, onSort }] = useTableData<TableDataType>([], 'symbol')
  useEffect(() => {
    if (!props.data) {
      setList([])
      return
    }

    let index = 0
    setList(props.data.map(item => {
      const lastData = stockUtils.toStock(item.stock, { extend: item.extend, symbol: item.symbol, name: item.name })
      const beforeData = stockUtils.toStock(item.extend?.stock_before, { extend: item.extend, symbol: item.symbol, name: item.name })
      const afterData = stockUtils.toStock(item.extend?.stock_after, { extend: item.extend, symbol: item.symbol, name: item.name })
      return {
        index: index++,
        key: nanoid(),
        stock_cycle: item.stock_cycle,
        indicator_name: item.indicator_name,
        symbol: lastData.symbol,
        name: lastData.name,
        close: lastData.close,
        percent: stockUtils.getPercent(lastData),
        total: stockUtils.getMarketValue(lastData),
        amount: lastData.turnover,
        industry: lastData.industry,
        bottom: item.indicator_name_hdly,
        prePercent: (stockUtils.getPercent(beforeData) ?? 0) * 100,
        afterPercent: (stockUtils.getPercent(afterData) ?? 0) * 100,
        collect: lastData.extend?.collect ?? 0
      }
    }))
  }, [props.data, setList])

  const { checked, onChange, setCheckedAll, getIsChecked } = useCheckboxGroup([])

  const updateStockCollect = useCallback((id: string, checked: boolean) => {
    updateList(s => {
      return s.map(produce(item => {
        if (item.symbol === id) {
          item.collect = checked ? 1 : 0
        }
      }))
    })
  }, [updateList])

  const columns: JknRcTableProps<TableDataType>['columns'] = useMemo(() => ([
    { title: '序号', dataIndex: 'index', width: 40, align: 'center', render: (_, row) => row.index + 1 },
    {
      title: '名称代码', dataIndex: 'name', width: 120, align: 'left', sort: true,
      render: (name, row) => (
        <StockView name={name} code={row.symbol} />
      )
    }, {
      title: '周期', dataIndex: 'stock_cycle', width: 40, align: 'right', sort: true,
      render: (stock_cycle) => `${stock_cycle}分`
    }, {
      title: '信号类型', dataIndex: 'indicator_name', width: 60, align: 'center'
    }, {
      title: '底部类型', dataIndex: 'bottom', width: 60, align: 'center', sort: true,
      render: (bottom) => bottom || '-'
    },
    {
      title: '现价', dataIndex: 'close', width: 80, align: 'right', sort: true,
      render: (close, row) => (
        <NumSpanSubscribe code={row.symbol} blink field="close" value={close} decimal={2} isPositive={(row.percent ?? 0) >= 0} align="right" />
      )
    },
    {
      title: '涨跌幅', dataIndex: 'percent', width: 90, align: 'right', sort: true,
      render: (percent, row) => (
        <NumSpanSubscribe code={row.symbol} field="percent" blink percent block decimal={2} value={percent} isPositive={(row.percent ?? 0) >= 0} symbol />
      )
    },
    {
      title: '成交额', dataIndex: 'amount', width: 100, align: 'right', sort: true,
      render: (amount, row) => <NumSpanSubscribe code={row.symbol} field="turnover" blink align="right" unit decimal={2} value={amount} />
    },
    {
      title: '总市值', dataIndex: 'total', width: 100, align: 'right', sort: true,
      render: (total, row) => <NumSpanSubscribe code={row.symbol} field={v => stockUtils.getSubscribeMarketValue(row, v)} blink align="right" unit decimal={2} value={total} />
    },
    {
      title: '所属行业', dataIndex: 'industry', width: 120, align: 'right',
    },
    {
      title: '盘前涨跌幅', dataIndex: 'prePercent', width: '15%', align: 'right', sort: true,
      render: (prePercent, row) => (
        <NumSpan symbol decimal={2} percent value={prePercent} isPositive={row.prePercent >= 0} />
      )
    },
    {
      title: '盘后涨跌幅', dataIndex: 'afterPercent', width: '15%', align: 'right', sort: true,
      render: (afterPercent, row) => (
        <NumSpan symbol decimal={2} percent value={afterPercent} isPositive={row.afterPercent >= 0} />
      )
    },
    {
      title: '+股票金池', dataIndex: 'collect', width: 60, align: 'center',
      render: (collect, row) => (
        <div>
          <CollectStar
            onUpdate={props.onUpdate}
            checked={collect}
            code={row.symbol} />
        </div>
      )
    },
    {
      title: '+AI报警', dataIndex: 't9', width: 50, align: 'center',
      render: (_, row) => <AiAlarm code={row.symbol} ><JknIcon className="rounded-none" name="ic_add" /></AiAlarm>
    },
    {
      title: <CollectStar.Batch checked={checked} onCheckChange={(v) => setCheckedAll(v ? list.map(o => o.symbol) : [])} />,
      dataIndex: 'check',
      id: 'select',
      width: 60, align: 'center',
      render: (_, row) => <JknCheckbox checked={getIsChecked(row.symbol)} onCheckedChange={v => onChange(row.symbol, v)} />
    }
  ]), [checked, list, getIsChecked, onChange, setCheckedAll, updateStockCollect, props.onUpdate])

  const onRowClick = useTableRowClickToStockTrading('symbol')


  return (
    <JknRcTable rowKey="key" columns={columns} data={list} onRow={onRowClick} onSort={onSort}>
    </JknRcTable>
  )
}


export default StockTable
