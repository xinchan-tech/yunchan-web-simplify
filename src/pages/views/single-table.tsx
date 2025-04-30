import {
  type StockExtend,
  type UsStockColumn,
  getChineseStocks,
  getIndexGapAmplitude,
  getIndexRecommends,
  getUsStocks
} from '@/api'
import { CollectStar, JknRcTable, type JknRcTableProps, StockView, SubscribeSpan } from '@/components'
import { useStockQuoteSubscribe, useTableData, useTableRowClickToStockTrading } from '@/hooks'
import { stockUtils } from '@/utils/stock'
import { useQuery } from '@tanstack/react-query'

import { useEffect, useMemo } from 'react'
import { useImmer } from 'use-immer'

interface SingleTableProps {
  type?: string
}

type TableDataType = {
  symbol: string
  name: string
  price?: number
  // 涨跌幅
  percent?: number
  // 成交额
  amount?: number
  // 总市值
  total?: number
  // 所属行业
  industry?: string
  // 盘前涨跌幅
  prePercent: number
  // 盘后涨跌幅
  afterPercent: number
  // 换手率
  turnoverRate?: number
  // 市盈率
  pe?: number
  // 市净率
  pb?: number
  collect: 1 | 0
  isUp?: boolean
  totalShare?: number
}
//单表格
const SingleTable = (props: SingleTableProps) => {
  const [sort, setSort] = useImmer<{ column: UsStockColumn; order: 'asc' | 'desc' }>({
    column: 'total_mv',
    order: 'desc'
  })
  const QueryFn = () => {
    const extend: StockExtend[] = ['basic_index', 'stock_before', 'stock_after', 'total_share', 'collect', 'financials']
    if (!props.type || ['all', 'ixic', 'spx', 'dji', 'etf'].includes(props.type)) {
      return getUsStocks({
        type: props.type === 'all' ? undefined : props.type,
        column: sort.column,
        limit: 50,
        page: 1,
        order: sort.order,
        extend
      }).then(r => r.items)
    }

    if (['china'].includes(props.type)) {
      return getChineseStocks(extend)
    }

    if (['yesterday_bear', 'yesterday_bull', 'short_amp_up', 'short_amp_d', 'release'].includes(props.type)) {
      return getIndexRecommends(props.type, extend)
    }

    if (props.type === 'gap') {
      return getIndexGapAmplitude(extend)
    }

    return getUsStocks({ type: props.type, column: 'total_mv', limit: 50, page: 1, order: 'desc', extend }).then(
      r => r.items
    )
  }

  const query = useQuery({
    queryKey: ['stock-table-view', props.type, sort],
    queryFn: () => QueryFn()
  })

  const [list, { setList, onSort }] = useTableData<TableDataType>([])

  useEffect(() => {
    const r: TableDataType[] = []

    if (!query.data) {
      setList([])
      return
    }

    for (const item of query.data) {
      // const [lastData, beforeData, afterData] = stockUtils.toStock(item)
      const lastData = stockUtils.toStock(item.stock, { extend: item.extend })

      const beforeData = stockUtils.toStock(item.extend.stock_before, { extend: item.extend })
      const afterData = stockUtils.toStock(item.extend.stock_after, { extend: item.extend })

      if (!lastData) continue

      r.push({
        symbol: item.symbol,
        name: item.name,
        price: lastData.close,
        percent: stockUtils.getPercent(lastData),
        total: stockUtils.getMarketValue(lastData),
        amount: lastData.turnover,
        industry: lastData.industry ?? '-',
        prePercent: stockUtils.getPercentUnsafe(beforeData),
        afterPercent: stockUtils.getPercentUnsafe(afterData),
        turnoverRate: stockUtils.getTurnOverRate(lastData),
        pe: stockUtils.getPE(lastData),
        pb: stockUtils.getPB(lastData),
        collect: lastData.extend?.collect ?? 0,
        isUp: stockUtils.isUp(lastData),
        totalShare: lastData.totalShare
      })
    }

    setList(r)
  }, [query.data, setList])

  const onSortChange: JknRcTableProps<TableDataType>['onSort'] = (columnKey, sort) => {
    if (!props.type || ['all', 'ixic', 'spx', 'dji', 'etf'].includes(props.type)) {
      const columnMap: Record<string, UsStockColumn> = {
        symbol: 'symbol',
        price: 'close',
        amount: 'amount',
        percent: 'increase',
        total: 'total_mv',
        prePercent: 'stock_before',
        afterPercent: 'stock_after',
        turnoverRate: 'turnover_rate'
      }

      if (columnKey === 'name' || columnKey === 'industry' || columnKey === 'pe' || columnKey === 'pb') {
        onSort(columnKey, sort)
        return
      }

      setSort({
        column: sort !== undefined ? columnMap[columnKey as string] : 'total_mv',
        order: sort === undefined ? 'desc' : sort
      })
    } else {
      onSort(columnKey, sort)
    }
  }

  useStockQuoteSubscribe(query.data?.map(o => o.symbol) ?? [])

  const columns = useMemo<JknRcTableProps<TableDataType>['columns']>(
    () => [
      {
        title: '',
        dataIndex: 'collect',
        align: 'center',
        width: '4%',
        render: (_, row) => <CollectStar checked={row.collect === 1} code={row.symbol} />
      },
      {
        title: '',
        dataIndex: 'index',
        align: 'center',
        width: '4%',
        render: (_, _row, index) => <span onClick={(e) => {e.preventDefault();e.stopPropagation()}} onKeyDown={() => void 0}>{index + 1}</span>
      },
      {
        title: '名称代码',
        dataIndex: 'symbol',
        align: 'left',
        width: '12.5%',
        sort: true,
        render: (_, row) => (
          <div className="flex items-center">
            <StockView name={row.name} code={row.symbol as string} showName />
          </div>
        )
      },
      {
        title: '现价',
        dataIndex: 'price',
        align: 'left',
        width: '11.5%',
        sort: true,
        render: (_, row) => (
          <SubscribeSpan.PriceBlink
            showColor={false}
            trading="intraDay"
            symbol={row.symbol}
            zeroText="--"
            initValue={row.price}
            decimal={2}
            initDirection={row.isUp}
          />
        )
      },
      {
        title: '涨跌幅',
        dataIndex: 'percent',
        align: 'left',
        width: '11.5%',
        sort: true,
        render: (_, row) => (
          <SubscribeSpan.PercentBlink
            showSign
            trading="intraDay"
            symbol={row.symbol}
            decimal={2}
            initValue={row.percent}
            initDirection={row.isUp}
            zeroText="0.00%"
            nanText="--"
          />
        )
      },
      {
        title: '成交额',
        dataIndex: 'amount',
        align: 'left',
        width: '13.5%',
        sort: true,
        render: (_, row) => (
          <SubscribeSpan.TurnoverBlink
            trading="intraDay"
            symbol={row.symbol}
            decimal={2}
            initValue={row.amount}
            showColor={false}
          />
        )
      },
      {
        title: '总市值',
        dataIndex: 'total',
        align: 'left',
        width: '13%',
        sort: true,
        render: (_, row) => (
          <SubscribeSpan.MarketValueBlink
            showColor={false}
            trading="intraDay"
            symbol={row.symbol}
            initValue={row.total}
            decimal={2}
            totalShare={row.totalShare ?? 0}
          />
        )
      },
      {
        title: '盘前涨跌幅',
        dataIndex: 'prePercent',
        align: 'left',
        width: '10%',
        sort: true,
        render: (_, row) => (
          <div className="">
            <SubscribeSpan.PercentBlink
              trading="preMarket"
              symbol={row.symbol}
              initValue={row.prePercent}
              decimal={2}
              showSign
              initDirection={row.prePercent > 0}
              zeroText="0.00%"
              nanText="--"
              showColor={true}
            />
          </div>
        )
      },
      {
        title: '盘后涨跌幅',
        dataIndex: 'afterPercent',
        align: 'left',
        width: '10%',
        sort: true,
        render: (_, row) => (
          <div className="">
            <SubscribeSpan.PercentBlink
              trading="afterHours"
              symbol={row.symbol}
              initValue={row.afterPercent}
              decimal={2}
              showSign
              initDirection={row.afterPercent > 0}
              zeroText="0.00%"
              nanText="--"
              showColor={true}
            />
          </div>
        )
      },
      {
        title: '所属行业',
        dataIndex: 'industry',
        align: 'right',
        sort: true,
        render: (_, row) => <span className="text-[14px]">{row.industry}</span>
      }
    ],
    []
  )

  const onRowClick = useTableRowClickToStockTrading('symbol')

  return (
    <JknRcTable
      headerHeight={61}
      isLoading={query.isLoading}
      columns={columns}
      rowKey="symbol"
      data={list}
      onSort={onSortChange}
      onRow={onRowClick}
      infiniteScroll={{ enabled: true }}
    />
    // <JknTable.Virtualizer rowHeight={35.5} onEvent={onTableEvent} loading={query.isLoading} manualSorting rowKey="symbol" onSortingChange={onSortChange} columns={columns} data={data}>
    // </JknTable.Virtualizer>
  )
}

export default SingleTable
