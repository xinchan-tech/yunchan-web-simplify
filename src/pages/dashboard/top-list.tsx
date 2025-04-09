import { IncreaseTopStatus, getIncreaseTop, getIncreaseTopV2 } from '@/api'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  JknIcon,
  JknRcTable,
  type JknRcTableProps,
  StockView,
  SubscribeSpan
} from '@/components'
import { useStockQuoteSubscribe, useTableData, useTableRowClickToStockTrading } from '@/hooks'
import { useTime } from '@/store'
import { dateToWeek } from '@/utils/date'
import { type StockTrading, stockUtils } from '@/utils/stock'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type TableDataType = ReturnType<typeof stockUtils.toStockWithExt>

const tradingToKey = (trading: StockTrading) => {
  switch (trading) {
    case 'preMarket':
      return 'PQRM'
    case 'intraDay':
      return 'PZRM'
    case 'afterHours':
      return 'PHRM'
    default:
      return 'PZRM'
  }
}

const TopList = () => {
  const trading = useTime(s => s.getTrading())
  const [type, setType] = useState<string>(tradingToKey(trading))

  const { t } = useTranslation()
  const { isToday } = useTime()
  const [list, { setList, onSort }] = useTableData<TableDataType>([], 'symbol')

  const query = useQuery({
    queryKey: [getIncreaseTop.cacheKey, type],
    queryFn: () => getIncreaseTopV2({ key: type as any, extend: ['total_share', 'stock_before', 'stock_after'] }),
    refetchInterval: 30 * 1000
  })

  const queryClient = useQueryClient()

  useEffect(() => {
    if (!query.data) {
      setList([])
      return
    }

    // const data = query.data?.map(item => stockUtils.toStockRecord(item))
    if (type === 'PQRM') {
      setList(
        query.data?.map(v =>
          stockUtils.toStockWithExt(trading === 'preMarket' ? v.extend?.stock_before : v.stock, {
            extend: v.extend,
            symbol: v.symbol,
            name: v.name
          })
        )
      )
    } else if (type === 'PHRM') {
      setList(
        query.data?.map(v =>
          stockUtils.toStockWithExt(trading === 'intraDay' ? v.stock : v.extend?.stock_after, {
            extend: v.extend,
            symbol: v.symbol,
            name: v.name
          })
        )
      )
    } else {
      setList(
        query.data?.map(v => stockUtils.toStockWithExt(v.stock, { extend: v.extend, symbol: v.symbol, name: v.name }))
      )
    }
  }, [query.data, setList, type, trading])

  const onTypeChange = (s: string) => {
    setType(s)
    queryClient.invalidateQueries({ queryKey: [getIncreaseTop.cacheKey, s] })
  }

  useStockQuoteSubscribe(query.data?.map(d => d.symbol) ?? [])

  const columns: JknRcTableProps<TableDataType>['columns'] = [
    {
      title: '名称代码',
      dataIndex: 'name',
      align: 'left',
      sort: true,
      render: (_, row) => <StockView className="min-h-[26px]" code={row.symbol} name={row.name} />
    },
    {
      title: `${type === 'PQRM' ? '盘前' : type === 'PHRM' ? '盘后' : '现'}价`,
      dataIndex: 'close',
      align: 'right',
      sort: true,
      render: (_, row) => (
        <SubscribeSpan.PriceBlink
          showColor={false}
          trading={type === 'PQRM' ? 'preMarket' : type === 'PHRM' ? 'afterHours' : 'intraDay'}
          symbol={row.symbol}
          initValue={row.close}
          initDirection={stockUtils.isUp(row)}
        />
      )
    },
    {
      title: `${type === 'PQRM' ? '盘前' : type === 'PHRM' ? '盘后' : ''}涨跌幅`,
      dataIndex: 'percent',
      align: 'right',
      width: 120,
      sort: true,
      render: (percent, row) => (
        <SubscribeSpan.PercentBlink
          trading={type === 'PQRM' ? 'preMarket' : type === 'PHRM' ? 'afterHours' : 'intraDay'}
          symbol={row.symbol}
          showSign
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
      sort: true,
      render: (turnover, row) => (
        <SubscribeSpan.TurnoverBlink
          showColor={false}
          trading={type === 'PQRM' ? 'preMarket' : type === 'PHRM' ? 'afterHours' : 'intraDay'}
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
      sort: true,
      render: (marketValue, row) => (
        <SubscribeSpan.MarketValueBlink
          trading={type === 'PQRM' ? 'preMarket' : type === 'PHRM' ? 'afterHours' : 'intraDay'}
          symbol={row.symbol}
          decimal={2}
          showColor={false}
          initValue={marketValue}
          totalShare={row.totalShare ?? 0}
        />
      )
    }
  ]

  const onRowClick = useTableRowClickToStockTrading('symbol')

  // const rowClassName = (record: TableDataType) => {
  //   return selectedRowKey === record.symbol ? 'selected-row' : '';
  // };

  const tabs = [
    { key: 'PQRM', label: `${t('stockChart.before')}热门` },
    { key: 'PZRM', label: `${t('stockChart.in')}热门` },
    { key: 'PHRM', label: `${t('stockChart.after')}热门` },
    { key: 'ZRRM', label: '昨日' }
  ]
  return (
    <div className="w-full h-full flex flex-col font-pingfang">
      <div className="px-3 py-2.5 border-b-default">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="inline-flex items-center space-x-2 text-lg font-bold">
              <span>{tabs.find(tab => tab.key === type.toString())?.label ?? '-'}</span>
              <JknIcon.Svg name="arrow-down" size={10} />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {tabs.map(tab => (
              <DropdownMenuItem key={tab.key} onClick={() => onTypeChange(tab.key as string)}>
                {tab.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex-1 overflow-hidden">
        <JknRcTable
          rowKey="symbol"
          isLoading={query.isLoading}
          columns={columns}
          data={list}
          onSort={onSort}
          onRow={onRowClick}
        />
      </div>
    </div>
  )
}

export default TopList
