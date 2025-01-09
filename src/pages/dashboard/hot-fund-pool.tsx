import { getCollectHot } from "@/api"
import { CapsuleTabs, JknRcTable, type JknRcTableProps, NumSpan, NumSpanSubscribe, StockView } from "@/components"
import { useStockQuoteSubscribe, useTableData } from "@/hooks"
import { type StockRecord, type StockSubscribeHandler, stockUtils } from "@/utils/stock"
import { useQuery } from "@tanstack/react-query"
import Decimal from "decimal.js"
import { useCallback, useEffect, useMemo, useState } from "react"


// type 1: 最热关注
const HotType = 0

const TopList = () => {
  const query = useQuery({
    queryKey: [getCollectHot.cacheKey],
    queryFn: () => getCollectHot({ extend: ['total_share'] }),
    refetchInterval: 30 * 1000
  })
  const [list, {setList, onSort}] = useTableData<StockRecord>([], 'symbol')

  useEffect(() => {
    setList(query.data?.find(v => v.type === HotType)?.stocks.map(v => stockUtils.toStockRecord(v)[0]) ?? [])
  }, [query.data, setList])

  useStockQuoteSubscribe(query.data?.find(v => v.type === HotType)?.stocks.map(v => v.symbol) ?? [], () => {})

  const columns: JknRcTableProps<StockRecord>['columns'] = [
    {
      title: '名称代码', dataIndex: 'name',align: 'left',
      sort: true,
      render: (_, row) => <StockView code={row.code} name={row.name} />
    },
    {
      title: '现价', dataIndex: 'close',align: 'right', width: '17%', sort: true,
      render: (_, row) => <NumSpanSubscribe code={row.symbol} field="record.close" blink value={Decimal.create(row.close).toFixed(2)} isPositive={row.isUp} align="right" />
    },
    {
      title: '涨跌幅', dataIndex: 'percent',
      align: 'right', width: '20%', sort: true,
      render: (_, row) => (
        <NumSpanSubscribe code={row.symbol} field="record.percent"  block blink className="py-1 w-20" decimal={2} align="right" value={Decimal.create(row.percent).mul(100).toDP(2).toNumber()} percent isPositive={row.isUp} symbol />
      )
    },
    {
      title: '成交额', dataIndex: 'turnover',
      align: 'right', width: '20%', sort: true,
      render: (_, row) => <NumSpanSubscribe code={row.symbol} field="record.turnover"  blink align="right" unit decimal={2} value={row.turnover} />
    },
    {
      title: '总市值', dataIndex: 'marketValue',
      align: 'right', width: '19%', sort: true,
      render: (_, row) => <NumSpanSubscribe code={row.symbol} field={v => v.record.close * (row.marketValue ?? 0)} blink align="right" unit decimal={2} value={row.marketValue} />
    },
  ]
  return (
    <div className="w-full h-full">
      <div className="border-style-primary px-1 py-2">
        <CapsuleTabs activeKey="hot">
          <CapsuleTabs.Tab value="hot" label={<span>热度金池</span>} />
        </CapsuleTabs>
      </div>
      <div className="h-[calc(100%-38px)] overflow-hidden">
        <JknRcTable isLoading={query.isLoading} onSort={onSort} rowKey="code" columns={columns} data={list} />
      </div>
    </div>
  )
}

export default TopList