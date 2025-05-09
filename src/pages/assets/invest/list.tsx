import { StockSelectCache, TcRcTable, type TcRcTableProps, CollectStar, StockView, SubscribeSpan } from '@/components'
import { getInvestStocks } from '@/api'
import { useQuery } from '@tanstack/react-query'
import { useQueryParams } from '@/hooks'
import { useCheckboxGroup, useTableData, useTableRowClickToStockTrading } from '@/hooks'
import { useMemo, useState, useEffect } from 'react'
import Decimal from 'decimal.js'
import { stockUtils } from '@/utils/stock'
import { numToDay } from '@/utils/date'
import { getColor } from '../const'
import { cn } from '@/utils/style'

type TableDataType = {
  cost?: number;
  market_value?: number;
  name?: string;
  position_rate?: number;
  position_time?: number;
  price?: number;
  profit_loss?: number;
  profit_loss_rate_today?: number;
  profit_loss_today?: number;
  quantity?: number;
  return_rate?: number;
  symbol?: string;
  [property: string]: any;
}

const InvestList = () => {
  const [active, setActive] = useState<string>()
  const [total, setTotal] = useState<number>(0)
  const [dates, setDates] = useState<string[]>([])
  const [data, { onSort, setList }] = useTableData<TableDataType>([])
  const [keyWord, setKeyWord] = useState<string>('')


  const query = useQuery({
    queryKey: [getInvestStocks.cacheKey, keyWord],
    queryFn: () =>
      getInvestStocks({ symbol: keyWord })
  })


  // useEffect(() => {
  //   console.log('query.data88888', query.data)
  //   if (query.data?.length) {
  //     setActive(query.data.dates[0])
  //     setDates(query.data.dates)
  //   }
  // }, [query.data])

  useEffect(() => {
    console.log('query.data', query.data)
    const r: TableDataType[] = []
    if (!query.data) {
      setList([])
      return
    }
    console.log('query.data', query.data)

    for (const { id, time, date, ...stock } of query.data) {
      const lastStock = stockUtils.toStockWithExt(stock.stock, {
        extend: stock.extend,
        name: stock.name,
        symbol: stock.symbol
      })
      const beforeStock = stockUtils.toStockWithExt(stock.extend?.stock_before, {
        extend: stock.extend,
        name: stock.name,
        symbol: stock.symbol
      })
      const afterStock = stockUtils.toStockWithExt(stock.extend?.stock_after, {
        extend: stock.extend,
        name: stock.name,
        symbol: stock.symbol
      })

      r.push({
        ...stock,
        name: lastStock.name,
        code: lastStock.symbol,
        id,
        date: `${date?.substring(5, 10)} ${time}`,
        percent: lastStock?.percent && lastStock.percent,
        turnover: lastStock?.turnover || undefined,
        total: lastStock?.marketValue || undefined,
        industry: lastStock?.industry,
        prePercent: beforeStock?.percent,
        afterPercent: afterStock?.percent,
        collect: lastStock?.extend?.collect,
        isUp: stockUtils.isUp(lastStock)
      })
    }
    setList(r)
    setTotal(r.length)
  }, [query.data, setList])

  const columns: TcRcTableProps<TableDataType>['columns'] = useMemo(
    () => [
      {
        title: '序号',
        dataIndex: 'id',
        enableSorting: false,
        align: 'center',
        width: '6rem',
        render: (_, __, index) => <span>{index + 1}</span>
      },
      {
        title: '名称代码',
        dataIndex: 'code',
        align: 'left',
        width: '25%',
        sort: true,
        render: (_, row) => (
          <div className="flex items-center h-[33px]">
            <StockView name={row.name} code={row.code as string} showName />
          </div>
        )
      },

      {
        title: '现价',
        dataIndex: 'price',
        align: 'left',
        width: '13.5%',
        sort: true,
        render: (_: any, row) => (
          <SubscribeSpan.Price
            showColor={false}
            symbol=""
            subscribe={false}
            initValue={row.price}
            decimal={3}
            initDirection={row.isUp}
            zeroText="--"
          />
        )
      },
      {
        title: '数量',
        dataIndex: 'quantity',
        align: 'left',
        width: '13%',
        sort: true,
      },
      {
        title: '成本',
        dataIndex: 'cost',
        align: 'left',
        width: '13%',
        sort: true,
        render: (_: any, row) => Decimal.create(row.cost).toShortCN(3)
      },
      {
        title: '市值',
        dataIndex: 'market_value',
        align: 'left',
        width: '13%',
        sort: true,
        render: (_: any, row) => Decimal.create(row.market_value).toShortCN(3)
      },
      {
        title: '盈亏额',
        dataIndex: 'profit_loss',
        align: 'left',
        width: '13.5%',
        sort: true,
        render: (_: any, row) => <span className={getColor(row.profit_lo)}>{Decimal.create(row.profit_loss).toShortCN(3)}</span> 
      },
      {
        title: '回报率',
        dataIndex: 'return_rate',
        align: 'center',
        width: '13.5%',
        sort: true,
        render: (_, row) => (
          <span className={cn('text-stock-up', getColor(row.return_rate))}>{row.return_rate ?? '--'}</span>
        )
      },
      {
        title: '仓位占比',
        dataIndex: 'position_rate',
        width: '13.5%',
        align: 'center',
        sort: true,
        render: (_: any, row) => <span className="text-[#808080]">{row.position_rate}</span>
      },
      {
        title: '当日盈亏额',
        dataIndex: 'profit_loss_today',
        align: 'center',
        width: '13.5%',
        sort: true,
        render: (_: any, row) => <span className={cn('text-[#808080]', getColor(row.return_rate))}>{row.profit_loss_today}</span>
      },
      {
        title: '当日盈比例',
        dataIndex: 'profit_loss_rate_today',
        width: '13.5%',
        align: 'center',
        sort: true,
        render: (_: any, row) => <span className={cn('text-[#808080]', getColor(row.return_rate))}>{row.profit_loss_rate_today}</span>
      },
      {
        title: '持仓时间',
        dataIndex: 'position_time',
        width: '13.5%',
        align: 'center',
        sort: true,
        render: (_: any, row) => <span className="">{row.position_time ? numToDay(row.position_time) : '--'}</span>
      },
    ],
    []
  )

  return <div className="bg-[#1A191B] rounded-[2rem] pt-6 px-[2px] box-border w-full">
    <div className="flex justify-between items-center px-6 box-border">
      <div className="border-[1px] border-solid border-[#3c3c3c] rounded-lg w-[10rem] p-1.5 box-border text-[#B8B8B8] text-base">投资组合股票 {total}只</div>
      <StockSelectCache allowClear placeholder="查询" className='rounded-lg' width="18.75rem" onChange={v => setKeyWord(v)} />
    </div>

    <div className="overflow-auto h-full mt-5">
      <TcRcTable
        headerHeight={61}
        onSort={onSort}
        isLoading={query.isLoading}
        // onRow={onRowClick}
        rowKey="code"
        columns={columns}
        data={data}
      />
    </div>
  </div>
}

export default InvestList