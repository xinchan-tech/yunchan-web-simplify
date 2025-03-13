import { type StockExtend, type UsStockColumn, getUsStocks } from '@/api'
import {
  CollectStar,
  JknRcTable,
  type JknRcTableProps,
  StockView,
  SubscribeSpan
} from '@/components'
import { useStockQuoteSubscribe, useTableData, useTableRowClickToStockTrading } from '@/hooks'
import { stockUtils } from '@/utils/stock'
import { useInfiniteQuery } from '@tanstack/react-query'

import { useEffect, useMemo } from 'react'
import { useImmer } from 'use-immer'

interface PageTableProps {
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
const PageTable = (props: PageTableProps) => {
  const [sort, setSort] = useImmer<{ column: UsStockColumn; order: 'asc' | 'desc' }>({
    column: 'total_mv',
    order: 'desc'
  })
  const queryFn = (page: number) => {
    const extend: StockExtend[] = ['basic_index', 'stock_before', 'stock_after', 'total_share', 'collect', 'financials']
    return getUsStocks({
      type: props.type === 'all' ? undefined : props.type,
      column: sort.column,
      limit: 50,
      page,
      order: sort.order,
      extend
    })
  }

  const query = useInfiniteQuery({
    queryKey: [getUsStocks.cacheKey, props.type, sort],
    queryFn: params => queryFn(params.pageParam),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      return lastPage.last < lastPage.current ? undefined : lastPage.current + 1
    }
  })

  const [list, { setList, onSort }] = useTableData<TableDataType>([], 'symbol')

  useEffect(() => {
    const r: TableDataType[] = []

    if (!query.data?.pages) {
      setList([])
      return
    }

    const allPage = query.data.pages.flatMap(o => o.items)

    for (const item of allPage) {
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
        code: 'symbol',
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

  useStockQuoteSubscribe(query.data?.pages.flatMap(o => o.items).map(item => item.symbol) ?? [])

  const columns = useMemo<JknRcTableProps<TableDataType>['columns']>(
    () => [
      {
        title: <span className="text-[14px]">名称代码</span>,
        dataIndex: 'name',
        align: 'left',
        sort: true,
        render: (_, row) => <div className='flex items-center h-[33px]'>
          <CollectStar checked={row.collect === 1} code={row.symbol} />
          <span className="mr-4"/>
          <StockView name={row.name} code={row.symbol as string} showName />
        </div>
      },
      {
        title: <span className="text-[14px]">现价</span>,
        dataIndex: 'price',
        align: 'left',
        width: '13%',
        sort: true,
        render: (_, row) => (
          <SubscribeSpan.PriceBlink
            showColor={false}
            trading="intraDay"
            symbol={row.symbol}
            initValue={row.price}
            decimal={2}
            initDirection={row.isUp}
          />
        )
      },
      {
        title: <span className="text-[14px]">涨跌幅</span>,
        dataIndex: 'percent',
        align: 'left',
        width: '13%',
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
          />
        )
      },
      {
        title: <span className="text-[14px]">成交额</span>,
        dataIndex: 'amount',
        align: 'left',
        width: '13%',
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
        title: <span className="text-[14px]">总市值</span>,
        dataIndex: 'total',
        align: 'left',
        width: '13%',
        sort: true,
        render: (_, row) => (
          <SubscribeSpan.MarketValueBlink
            trading="intraDay"
            symbol={row.symbol}
            initValue={row.total}
            decimal={2}
            totalShare={row.totalShare ?? 0}
            showColor={false}
          />
        )
      },
      {
        title: <span className="text-[14px]">所属行业</span>,
        dataIndex: 'industry',
        align: 'right',
        width: '15%',
        sort: true
      }
    ],
    [list, query.refetch]
  )

  const onRowClick = useTableRowClickToStockTrading('symbol')

  return (
    <JknRcTable
      isLoading={query.isLoading}
      columns={columns}
      rowKey="symbol"
      data={list}
      onSort={onSortChange}
      onRow={onRowClick}
      infiniteScroll={{
        enabled: true,
        fetchMore: () => !query.isFetchingNextPage && query.fetchNextPage(),
        hasMore: query.hasNextPage
      }}
    />
  )
}

export default PageTable
