import { getPlateStocks } from '@/api'
import {
  CollectStar,
  JknRcTable,
  type JknRcTableProps,
  StockView,
  SubscribeSpan
} from '@/components'
import { useCheckboxGroup, useStockQuoteSubscribe, useTableData, useTableRowClickToStockTrading } from '@/hooks'
import { stockUtils } from '@/utils/stock'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

interface PlateStocksProps {
  plateId?: number
}

type TableDataType = ReturnType<typeof stockUtils.toStockWithExt>

const PlateStocks = (props: PlateStocksProps) => {
  const plateStocks = useQuery({
    queryKey: [getPlateStocks.cacheKey, props.plateId],
    queryFn: () =>
      getPlateStocks(+props.plateId!, [
        'basic_index',
        'stock_before',
        'stock_after',
        'total_share',
        'collect',
        'financials'
      ]),
    enabled: !!props.plateId
  })

  const [list, { setList, onSort }] = useTableData<TableDataType>([])
  useCheckboxGroup([])

  useEffect(() => {
    setList(
      plateStocks.data?.map(item =>
        stockUtils.toStockWithExt(item.stock, { extend: item.extend, name: item.name, symbol: item.symbol })
      ) ?? []
    )
  }, [plateStocks.data, setList])

  useStockQuoteSubscribe(plateStocks.data?.map(o => o.symbol) ?? [])

  const columns = useMemo<JknRcTableProps<TableDataType>['columns']>(
    () => [
      {
        title: '',
        dataIndex: 'collect',
        align: 'center',
        width: '4%',
        render: (_, row) => <CollectStar checked={row.extend?.collect === 1} code={row.symbol} />
      },
      {
        title: '',
        dataIndex: 'index',
        align: 'center',
        width: '5%',
        render: (_, _row, index) => <span onClick={(e) => {e.preventDefault();e.stopPropagation()}} onKeyDown={() => void 0}>{index + 1}</span>
      },
      {
        title: '名称代码',
        dataIndex: 'symbol',
        align: 'left',
        sort: true,
        width: '23.5%',
        render: (_, row) => (
          <div className="flex items-center h-[33px]">
            <StockView name={row.name} code={row.symbol as string} showName />
          </div>
        )
      },
      {
        title: '现价',
        dataIndex: 'close',
        align: 'left',
        width: '13.5%',
        sort: true,
        render: (_, row) => (
          <SubscribeSpan.PriceBlink
            showColor={false}
            trading="intraDay"
            symbol={row.symbol}
            initValue={row.close}
            decimal={2}
            initDirection={stockUtils.isUp(row)}
          />
        )
      },
      {
        title: '涨跌幅',
        dataIndex: 'percent',
        align: 'left',
        width: '13.5%',
        sort: true,
        render: (_, row) => (
          <SubscribeSpan.PercentBlink
            showSign
            trading="intraDay"
            symbol={row.symbol}
            decimal={2}
            initValue={row.percent}
            initDirection={stockUtils.isUp(row)}
            zeroText="0.00%"
          />
        )
      },
      {
        title: '成交额',
        dataIndex: 'turnover',
        align: 'left',
        width: '13.5%',
        sort: true,
        render: (_, row) => (
          <SubscribeSpan.TurnoverBlink
            trading="intraDay"
            symbol={row.symbol}
            decimal={2}
            initValue={row.turnover}
            showColor={false}
          />
        )
      },
      {
        title: '总市值',
        dataIndex: 'marketValue',
        align: 'left',
        width: '13.5%',
        sort: true,
        render: (_, row) => (
          <div className="">
            <SubscribeSpan.MarketValueBlink
              trading="intraDay"
              symbol={row.symbol}
              initValue={row.marketValue}
              decimal={2}
              totalShare={row.totalShare ?? 0}
              showColor={false}
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
      isLoading={plateStocks.isLoading}
      rowKey="symbol"
      columns={columns}
      data={list}
      onSort={onSort}
      onRow={onRowClick}
    />
  )
}

export default PlateStocks
