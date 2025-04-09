import { getStockCollects } from '@/api'
import { Button, CollectDropdownMenu, JknRcTable, StockView, SubscribeSpan } from '@/components'
import { useStockQuoteSubscribe, useTableData, useTableRowClickToStockTrading } from '@/hooks'
import { useToken } from '@/store'
import { appEvent } from '@/utils/event'
import { stockUtils } from '@/utils/stock'
import { useQuery } from '@tanstack/react-query'
import type { TableProps } from 'rc-table'
import { useEffect, useState } from 'react'

type TableDataType = ReturnType<typeof stockUtils.toStockWithExt>

const GoldenStockPool = () => {
  const [type, setType] = useState('1')
  const { token } = useToken()
  const [list, { setList, onSort }] = useTableData<TableDataType>([], 'symbol')

  const query = useQuery({
    queryKey: [getStockCollects.cacheKey, type],
    refetchInterval: 5 * 1000,
    queryFn: () =>
      getStockCollects({
        cate_id: +type,
        extend: [
          'total_share',
          'basic_index',
          'day_basic',
          'alarm_ai',
          'alarm_all',
          'financials',
          'thumbs',
          'stock_after',
          'stock_before'
        ],
        limit: 300
      }),
    enabled: !!token
  })

  useEffect(() => {
    const list =
      query.data?.items.map(item =>
        stockUtils.toStockWithExt(item.stock, { extend: item.extend, name: item.name, symbol: item.symbol })
      ) ?? []
    setList(list)
  }, [query.data, setList])

  useStockQuoteSubscribe(query.data?.items?.map(d => d.symbol) ?? [])

  const onLogin = () => {
    appEvent.emit('login')
  }

  const columns: TableProps<TableDataType>['columns'] = [
    {
      title: '名称代码',
      dataIndex: 'name',
      align: 'left',
      sort: true,
      render: (name, row) => <StockView className="min-h-[26px]" code={row.symbol} name={name} />
    },
    {
      title: '现价',
      dataIndex: 'close',
      align: 'right',
      width: '17%',
      sort: true,
      render: (close, row) => (
        <SubscribeSpan.PriceBlink
          showColor={false}
          symbol={row.symbol}
          initValue={close}
          initDirection={stockUtils.isUp(row)}
        />
      )
    },
    {
      title: '涨跌幅',
      dataIndex: 'percent',
      align: 'right',
      width: '20%',
      sort: true,
      render: (percent, row) => (
        <SubscribeSpan.PercentBlink
          showSign
          symbol={row.symbol}
          decimal={2}
          initValue={percent}
          initDirection={stockUtils.isUp(row)}
        />
      )
    },
    {
      title: '成交额',
      dataIndex: 'turnover',
      align: 'right',
      width: '20%',
      sort: true,
      render: (turnover, row) => (
        <SubscribeSpan.TurnoverBlink
          showColor={false}
          symbol={row.symbol}
          decimal={2}
          initValue={turnover}
          initDirection={stockUtils.isUp(row)}
        />
      )
    },
    {
      title: '总市值',
      dataIndex: 'marketValue',
      align: 'right',
      width: '19%',
      sort: true,
      render: (marketValue, row) => (
        <SubscribeSpan.MarketValueBlink
          symbol={row.symbol}
          decimal={2}
          initValue={marketValue}
          totalShare={row.totalShare ?? 0}
          showColor={false}
        />
      )
    }
  ]

  const onRowClick = useTableRowClickToStockTrading('symbol')

  return (
    <div className="w-full h-full flex flex-col overflow-hidden font-pingfang">
      <div className="flex items-center border-b-default">
        <CollectDropdownMenu activeKey={type} onChange={setType} />
      </div>
      <div className="flex-1 overflow-hidden">
        {token ? (
          <JknRcTable
            isLoading={query.isLoading}
            columns={columns}
            data={list}
            onSort={onSort}
            rowKey="symbol"
            className="w-full"
            onRow={onRowClick}
          />
        ) : (
          <div className="w-full text-center mt-40">
            <div className="mb-4 text-secondary">尚未登录账号</div>
            <Button onClick={onLogin}>登录账号</Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default GoldenStockPool
