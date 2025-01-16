import { getPlateStocks } from "@/api"
import { AiAlarm, CollectStar, JknCheckbox, JknIcon, JknRcTable, type JknRcTableProps, NumSpanSubscribe, StockView } from "@/components"
import { useCheckboxGroup, useStockBarSubscribe, useStockQuoteSubscribe, useTableData, useTableRowClickToStockTrading } from "@/hooks"
import { type Stock, stockUtils } from "@/utils/stock"
import { useQuery } from "@tanstack/react-query"
import Decimal from "decimal.js"
import { useCallback, useEffect, useMemo } from "react"

interface PlateStocksProps {
  plateId?: number
}

type TableDataType = ReturnType<typeof stockUtils.toStockWithExt>

const PlateStocks = (props: PlateStocksProps) => {
  const plateStocks = useQuery({
    queryKey: [getPlateStocks.cacheKey, props.plateId],
    queryFn: () => getPlateStocks(+props.plateId!, ['basic_index', 'stock_before', 'stock_after', 'total_share', 'collect', 'financials']),
    enabled: !!props.plateId
  })

  const [list, { setList, onSort, updateList }] = useTableData<TableDataType>([], 'symbol')
  const { checked, onChange, setCheckedAll, getIsChecked } = useCheckboxGroup([])

  useEffect(() => {
    setList(
      plateStocks.data?.map(item => stockUtils.toStockWithExt(item.stock, { extend: item.extend, name: item.name, symbol: item.symbol })) ?? []
    )
  }, [plateStocks.data, setList])

  const updateStockCollect = useCallback((id: string, checked: boolean) => {
    updateList(s => {
      return s.map(item => {
        if (item.symbol === id) {
          item.extend!.collect = checked ? 1 : 0
        }

        return item
      })
    })
  }, [updateList])

  useStockQuoteSubscribe(plateStocks.data?.map(o => o.symbol) ?? [])


  const columns = useMemo<JknRcTableProps<TableDataType>['columns']>(() => [
    { title: '序号', dataIndex: 'index', render: (_, __, index) => index + 1, align: 'center', width: 60 },
    {
      title: '名称代码', dataIndex: 'name', align: 'left', width: 'full', sort: true,
      render: (_, row) => (
        <StockView name={row.name} code={row.symbol as string} />
      )
    },
    {
      title: '现价', dataIndex: 'close', align: 'right', width: '10%', sort: true,
      render: (close, row) => (
        <NumSpanSubscribe blink code={row.symbol} field="close" value={close} decimal={2} isPositive={stockUtils.isUp(row)} align="right" />
      )
    },
    {
      title: '涨跌幅', dataIndex: 'percent', align: 'right', width: 100, sort: true,
      render: (percent, row) => (
        <NumSpanSubscribe blink code={row.symbol} field="percent" block className="py-0.5 w-20" decimal={2} value={percent} isPositive={stockUtils.isUp(row)} percent align="right" />
      )
    },
    {
      title: '总市值', dataIndex: 'marketValue', align: 'right', width: '10%', sort: true,
      render: (marketValue, row) => <NumSpanSubscribe blink code={row.symbol} field={v => stockUtils.getSubscribeMarketValue(row, v)} value={marketValue} decimal={2} align="right" unit />
    },
    {
      title: '成交额', dataIndex: 'turnover', align: 'right', width: '10%', sort: true,
      render: (turnover, row) => <NumSpanSubscribe blink code={row.symbol} field="turnover" value={turnover} decimal={2} align="right" unit />
    },
    {
      title: '换手率', dataIndex: 'turnOverRate', align: 'right', width: '7%',
      render: (turnOverRate) => `${Decimal.create(turnOverRate).mul(100).toFixed(2)}%`
    },
    {
      title: '市盈率', dataIndex: 'pe', align: 'right', width: '7%',
      render: (_, row) => Decimal.create(stockUtils.getPE(row)).toFixed(2)
    },
    {
      title: '市净率', dataIndex: 'pb', align: 'right', width: '7%',
      render: (_, row) => Decimal.create(stockUtils.getPB(row)).toFixed(2)
    },
    {
      title: '+股票金池', dataIndex: 'collect', align: 'center', width: 80,
      render: (_, row) => (
        <CollectStar
          onUpdate={(checked) => updateStockCollect(row.symbol, checked)}
          checked={row.extend!.collect === 1}
          code={row.symbol} />
      )
    },
    {
      title: '+AI报警', dataIndex: 't9', align: 'center', width: 80,
      render: (_, row) => <AiAlarm code={row.symbol}><JknIcon className="rounded-none" name="ic_add" /></AiAlarm>
    },
    {
      title: <CollectStar.Batch checked={checked} onCheckChange={(v) => setCheckedAll(v ? list.map(o => o.symbol) : [])} />,
      dataIndex: 'checked',
      align: 'center',
      width: 60,
      render: (_, row) => <JknCheckbox checked={getIsChecked(row.symbol)} onCheckedChange={v => onChange(row.symbol, v)} />
    }
  ], [checked, list, getIsChecked, onChange, setCheckedAll, updateStockCollect])


  const onRowClick = useTableRowClickToStockTrading('symbol')

  return (
    <JknRcTable isLoading={plateStocks.isLoading}
      rowKey="symbol"
      columns={columns}
      data={list}
      onSort={onSort}
      onRow={onRowClick}
    />
  )
}

export default PlateStocks