import { getCollectHot } from "@/api"
import { CapsuleTabs, JknRcTable, type JknRcTableProps, NumSpanSubscribe, StockView } from "@/components"
import { useStockQuoteSubscribe, useTableData, useTableRowClickToStockTrading } from "@/hooks"
import { stockUtils } from "@/utils/stock"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"

// type 1: 最热关注
const HotType = 0

type TableDataType = ReturnType<typeof stockUtils.toStockWithExt>

const TopList = () => {
  const query = useQuery({
    queryKey: [getCollectHot.cacheKey],
    queryFn: () => getCollectHot({ extend: ['total_share'] }),
    refetchInterval: 30 * 1000
  })
  const [list, { setList, onSort }] = useTableData<TableDataType>([], 'symbol')

  useEffect(() => {
    setList(query.data?.find(v => v.type === HotType)?.stocks.map(v => stockUtils.toStockWithExt(v.stock, { extend: v.extend, symbol: v.symbol, name: v.name })) ?? [])
  }, [query.data, setList])

  useStockQuoteSubscribe(query.data?.find(v => v.type === HotType)?.stocks.map(v => v.symbol) ?? [], () => { })

  const columns: JknRcTableProps<TableDataType>['columns'] = [
    {
      title: '名称代码', dataIndex: 'name', align: 'left',
      sort: true,
      render: (name, row) => <StockView code={row.symbol} name={name} />
    },
    {
      title: '现价', dataIndex: 'close', align: 'right', width: '17%', sort: true,
      render: (close, row) => <NumSpanSubscribe code={row.symbol} field="close" blink value={close} isPositive={stockUtils.isUp(row)} align="right" />
    },
    {
      title: '涨跌幅', dataIndex: 'percent',
      align: 'right', width: '20%', sort: true,
      render: (percent, row) => (
        <NumSpanSubscribe code={row.symbol} field="percent" block blink decimal={2} align="right" value={percent} percent isPositive={stockUtils.isUp(row)} symbol />
      )
    },
    {
      title: '成交额', dataIndex: 'turnover',
      align: 'right', width: '20%', sort: true,
      render: (turnover, row) => <NumSpanSubscribe code={row.symbol} field="turnover" blink align="right" unit decimal={2} value={turnover} />
    },
    {
      title: '总市值', dataIndex: 'marketValue',
      align: 'right', width: '19%', sort: true,
      render: (marketValue, row) => <NumSpanSubscribe code={row.symbol} field={v => stockUtils.getSubscribeMarketValue(row, v)} blink align="right" unit decimal={2} value={marketValue} />
    },
  ]

  const onRowClick = useTableRowClickToStockTrading('symbol')

  return (
    <div className="w-full h-full">
      <div className="border-style-primary px-1 py-2">
        <CapsuleTabs activeKey="hot">
          <CapsuleTabs.Tab value="hot" label={<span>热度金池</span>} />
        </CapsuleTabs>
      </div>
      <div className="h-[calc(100%-38px)] overflow-hidden">
        <JknRcTable isLoading={query.isLoading} onSort={onSort} rowKey="symbol" columns={columns} data={list} onRow={onRowClick} />
      </div>
    </div>
  )
}

export default TopList