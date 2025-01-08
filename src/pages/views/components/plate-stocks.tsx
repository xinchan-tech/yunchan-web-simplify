import { getPlateStocks } from "@/api"
import { AiAlarm, CollectStar, JknCheckbox, JknIcon, JknRcTable, type JknRcTableProps, NumSpan, StockView } from "@/components"
import { useCheckboxGroup, useTableData, useTableRowClickToStockTrading } from "@/hooks"
import { type StockRecord, stockUtils } from "@/utils/stock"
import { useQuery } from "@tanstack/react-query"
import Decimal from "decimal.js"
import { useCallback, useEffect, useMemo } from "react"

interface PlateStocksProps {
  plateId?: number
}

const PlateStocks = (props: PlateStocksProps) => {
  const plateStocks = useQuery({
    queryKey: [getPlateStocks.cacheKey, props.plateId],
    queryFn: () => getPlateStocks(+props.plateId!, ['basic_index', 'stock_before', 'stock_after', 'total_share', 'collect', 'financials']),
    enabled: !!props.plateId
  })

  const [list, { setList, onSort, updateList }] = useTableData<StockRecord>([], 'symbol')
  const { checked, onChange, setCheckedAll, getIsChecked } = useCheckboxGroup([])

  useEffect(() => {
    setList(
      plateStocks.data?.map(item => stockUtils.toStockRecord(item)[0]) ?? []
    )
  }, [plateStocks.data, setList])

  const updateStockCollect = useCallback((id: string, checked: boolean) => {
    updateList(s => {
      return s.map(item => {
        if (item.symbol === id) {
          item.collect = checked ? 1 : 0
        }

        return item
      })
    })
  }, [updateList])


  const columns = useMemo<JknRcTableProps<StockRecord>['columns']>(() => [
    { title: '序号', dataIndex: 'index', render: (_, __, index) => index + 1, align: 'center', width: 60 },
    {
      title: '名称代码', dataIndex: 'name', align: 'left', width: 'full',
      render: (_, row) => (
        <StockView name={row.name} code={row.code as string} />
      )
    },
    {
      title: '现价', dataIndex: 'close', align: 'right', width: '10%',
      render: (_, row) => (
        <NumSpan value={row.close} decimal={3} isPositive={row.isUp} />
      )
    },
    {
      title: '涨跌幅', dataIndex: 'percent', align: 'right', width: 100,
      render: (_, row) => (
        <NumSpan percent block decimal={2} value={(row.percent ?? 0) * 100} isPositive={row.isUp} symbol />
      )
    },
    {
      title: '总市值', dataIndex: 'marketValue', align: 'right', width: '10%',
      render: (_, row) => Decimal.create(row.marketValue).toShortCN()
    },
    {
      title: '成交额', dataIndex: 'turnover', align: 'right', width: '10%',
      render: (_, row) => Decimal.create(row.turnover).toShortCN()
    },
    {
      title: '换手率', dataIndex: 'turnOverRate', align: 'right', width: '7%',
      render: (_, row) => `${Decimal.create(row.turnOverRate).mul(100).toFixed(2)}%`
    },
    {
      title: '市盈率', dataIndex: 'pe', align: 'right', width: '7%',
      render: (_, row) => Decimal.create(row.pe).toFixed(2)
    },
    {
      title: '市净率', dataIndex: 'pb', align: 'right', width: '7%',
      render: (_, row) => Decimal.create(row.pb).toFixed(2)
    },
    {
      title: '+股票金池', dataIndex: 'collect', align: 'center', width: 80,
      render: (_, row) => (
        <CollectStar
          onUpdate={(checked) => updateStockCollect(row.symbol, checked)}
          checked={row.collect === 1}
          code={row.symbol} />
      )
    },
    {
      title: '+AI报警', dataIndex: 't9', align: 'center', width: 80,
      render: (_, row) => <AiAlarm code={row.code}><JknIcon className="rounded-none" name="ic_add" /></AiAlarm>
    },
    {
      title: <CollectStar.Batch checked={checked} onCheckChange={(v) => setCheckedAll(v ? list.map(o => o.symbol) : [])} />,
      dataIndex: 'checked',
      align: 'center',
      width: 60,
      render: (_, row) => <JknCheckbox checked={getIsChecked(row.symbol)} onCheckedChange={v => onChange(row.symbol, v)} />
    }
  ], [checked, list, getIsChecked, onChange, setCheckedAll, updateStockCollect])


  const onRowClick = useTableRowClickToStockTrading('code')

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