import { StockSelectCache, JknRcTable, JknPopconfirm, Button, type JknRcTableProps, JknRangePicker, StockView, SubscribeSpan } from '@/components'
import { getTradesList, delTadesCancel } from '@/api'
import { useQuery } from '@tanstack/react-query'
import { useQueryParams, useToast } from '@/hooks'
import { useTableData, useTableRowClickToStockTrading } from '@/hooks'
import { useMemo, useState, useEffect } from 'react'
import Decimal from 'decimal.js'
import { stockUtils } from '@/utils/stock'
import { useStockList } from '@/store'
import dayjs from 'dayjs'
import { cn } from '@/utils/style'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components';

type TableDataType = {
  name: string
  code: string
  date: string
  price?: number
  percent?: number
  turnover?: number
  total?: number
  industry?: string
  prePercent?: number
  afterPercent?: number
  collect?: number
  id: string
  isUp?: boolean
}

const HistoryList = () => {
  const [active, setActive] = useState<string>()
  const [total, setTotal] = useState<number>(0)
  const [starTime, setStarTime] = useState<Date | undefined>()
  const [endTime, setEndTime] = useState<string>('')
  const [data, { onSort, setList }] = useTableData<TableDataType>([])
  const listMap = useStockList(s => s.listMap)
  const [keyWord, setKeyWord] = useState<string>('')
  const [queryParams, setQueryParams] = useQueryParams<{ symbol: string }>()
  const { toast } = useToast()

  const query = useQuery({
    queryKey: [getTradesList.cacheKey, starTime, endTime, keyWord],
    queryFn: () =>
      getTradesList({
        page: 1,
        limit: 300,
        starTime,
        endTime,
        symbol: keyWord
      })
  })

  useEffect(() => {
    const r: TableDataType[] = []
    if (!query.data?.items) {
      setList([])
      return
    }

    for (const { id, time, ...stock } of query.data.items) {
      const lastStock = stockUtils.toStock(stock.stock, {
        extend: stock.extend,
        name: stock.name,
        symbol: stock.symbol
      })
      r.push({
        ...stock,
        name: lastStock.name,
        code: lastStock.symbol,
        id,
        // price: lastStock?.close || undefined,
        // percent: lastStock?.percent && lastStock.percent,
        // turnover: lastStock?.turnover || undefined,
        // total: lastStock?.marketValue || undefined,
        // industry: lastStock?.industry,
        // prePercent: beforeStock?.percent,
        // afterPercent: afterStock?.percent,
        // collect: lastStock?.extend?.collect,
        isUp: stockUtils.isUp(lastStock),
      })
    }
    setList(r)
    setTotal(r.length)
  }, [query.data?.items, setList])

  const handleCancel = (trade_ids: string) => {
    delTadesCancel({ trade_ids: [trade_ids] }).then(({ status, msg }) => {
      if (status == 1) {
        query.refetch()
      }
      toast(status == 1 ? '操作成功' : msg)
    })
    .catch((err) => {
      toast({ description: String(err) })
    })
  }

  const columns: JknRcTableProps<TableDataType>['columns'] = useMemo(
    () => [
      {
        title: '行动方向',
        dataIndex: 'direction',
        align: 'left',
        width: '6%',
        sort: true,
        render: (_, { direction }) => (
          <div className={cn("flex items-center h-[33px] text-[#22AB94]", direction == 1 ? 'text-[#22AB94]' : 'text-[#F23645]')}>
            {direction == 1 ? '买入' : '卖出'}
          </div>
        )
      },
      {
        title: '名称代码',
        dataIndex: 'code',
        align: 'left',
        width: '20%',
        sort: true,
        render: (_, row) => (
          <div className="flex items-center h-[33px]">
            <StockView name={row.name} code={row.code as string} showName />
          </div>
        )
      },

      {
        title: '日期',
        dataIndex: 'create_time',
        align: 'left',
        width: '10%',
        sort: true,
        render: (_: any, { create_time }) => create_time ? dayjs(create_time * 1000).format('YYYY-MM-DD') : "--"
      },
      {
        title: '订单价格',
        dataIndex: 'price',
        align: 'left',
        width: '10%',
        sort: true,
      },
      {
        title: '订单数量',
        dataIndex: 'quantity',
        align: 'left',
        width: '10%',
        sort: true,
      },
      {
        title: '订单金额',
        dataIndex: 'amount',
        align: 'left',
        width: '10%',
        sort: true,
        render: (_: any, row) => Decimal.create(row.amount).toShortCN(3)
      },
      {
        title: '类别',
        dataIndex: 'type',
        align: 'center',
        width: '10%',
        sort: true,
        render: (_: any, { type }) => <span className="text-[#808080]">
          {type ? type == 1 ? "常规" : "AI追踪" : "--"}
        </span>
      },
      {
        title: '状态',
        dataIndex: 'status_text',
        align: 'center',
        width: '10%',
        sort: true,
        render: (_: any, { status_text, status }) => <span className={cn("text-[#ECB920]", status != 1 && `text-[#${status == 2 ? '22AB94' : 'fff'}]`)}>
          {status_text ? status_text : "--"}
          {/* {status ? status == '1' ? "悬而未决" : "成功" : "--"} */}
        </span>
      },
      {
        title: '操作',
        dataIndex: 'opt',
        align: 'right',
        width: '5%',
        render: (_, { status, symbol, id }, index) => {
          return status == 1 ? <JknPopconfirm
            title={`您确定取消【${symbol}】吗?`}
            placement="bottomRight"
            onConfirm={() => handleCancel(id)}
            onCancel={() => console.log('取消操作')}
          >
            <div className='cursor-pointer'>取消</div>
          </JknPopconfirm>
            : null
        }
      }
    ],
    []
  )

  const onDateChange = (start: string, end: string) => {
    console.log(start, end)
    setStarTime(start ? dayjs(start).valueOf() / 1000 : undefined)
    setEndTime(end ? dayjs(end).valueOf() / 1000 : undefined)
  }

  return <div className="border-[1px] border-solid border-[#3c3c3c] rounded-md pt-6 px-[2px] box-border w-full">
    <div className="flex  justify-end  items-center px-6 box-border">
      <div className='flex align-center '>
        <div className="flex items-center justify-end mr-6">
          <JknRangePicker allowClear onChange={onDateChange} placeholder={["开始时间", "截止时间"]} />
        </div>
        <StockSelectCache allowClear placeholder="查询" className='rounded-lg' width="18.75rem" onChange={v => setKeyWord(v)} />
      </div>
    </div>

    <div className="overflow-auto h-full pb-10 box-border px-5 mt-5">
      <JknRcTable
        headerHeight={61}
        onSort={onSort}
        isLoading={query.isLoading}
        className='box-border pb-5'
        // onRow={onRowClick}
        rowKey="id"
        columns={columns}
        data={data}
      />
    </div>
  </div>
}

export default HistoryList