import { getPlateStocks } from "@/api"
import { AiAlarm, CollectStar, JknCheckbox, JknIcon, JknRcTable, type JknRcTableProps, StockView, SubscribeSpan } from "@/components"
import { useCheckboxGroup, useStockQuoteSubscribe, useTableData, useTableRowClickToStockTrading } from "@/hooks"
import { stockUtils } from "@/utils/stock"
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
      title: '现价', dataIndex: 'price', align: 'right', width: '8%', sort: true,
      render: (_, row) => (
        <SubscribeSpan.PriceBlink trading="intraDay" symbol={row.symbol} initValue={row.close} decimal={2} initDirection={stockUtils.isUp(row)} />
      )
    },
    {
      title: '涨跌幅', dataIndex: 'percent', align: 'right', width: 120, sort: true,
      render: (_, row) => (
        <SubscribeSpan.PercentBlockBlink trading="intraDay" symbol={row.symbol} decimal={2} initValue={row.percent} initDirection={stockUtils.isUp(row)} zeroText="0.00%" />
      )
    },
    {
      title: '成交额', dataIndex: 'amount', align: 'right', width: '8%', sort: true,
      render: (_, row) => (
        <SubscribeSpan.TurnoverBlink trading="intraDay" symbol={row.symbol} decimal={2} initValue={row.turnover} showColor={false} />
      )
    },
    {
      title: '总市值', dataIndex: 'total', align: 'right', width: '8%', sort: true,
      render: (_, row) => (
        <SubscribeSpan.MarketValueBlink trading="intraDay" symbol={row.symbol} initValue={row.marketValue} decimal={2} totalShare={row.totalShare ?? 0} />
      )
    },
    {
      title: '换手率', dataIndex: 'turnoverRate', align: 'right', width: '7%', sort: true,
      render: (turnoverRate) => `${Decimal.create(turnoverRate).mul(100).toFixed(2)}1%`
    },
    {
      title: '市盈率', dataIndex: 'pe', align: 'right', width: '7%', sort: true,
      render: (_, row) => `${Decimal.create(row.pe).lt(0) ? '亏损' : Decimal.create(row.pe).toFixed(2)}`
    },
    {
      title: '市净率', dataIndex: 'pb', align: 'right', width: '7%', sort: true,
      render: (pb) => Decimal.create(pb).toFixed(2)
    },
    {
      title: '+股票金池', dataIndex: 'collect', align: 'center', width: 80,
      render: (_, row) => (
        <CollectStar
          checked={row.extend!.collect === 1}
          code={row.symbol} />
      )
    },
    {
      title: '+AI报警', dataIndex: 't9', align: 'center', width: 80,
      render: (_, row) => <AiAlarm code={row.symbol}><JknIcon className="rounded-none" name="ic_add" /></AiAlarm>
    },
    {
      title: <CollectStar.Batch checked={checked} onCheckChange={(v) => setCheckedAll(v ? list.map(o => o.symbol) : [])}
        onUpdate={() => {
          plateStocks.refetch()
          setCheckedAll([])
        }}
      />,
      dataIndex: 'checked',
      align: 'center',
      width: 60,
      render: (_, row) => <JknCheckbox checked={getIsChecked(row.symbol)} onCheckedChange={v => onChange(row.symbol, v)} />
    }
  ], [checked, list, getIsChecked, onChange, setCheckedAll, plateStocks.refetch])


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