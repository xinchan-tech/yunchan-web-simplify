import { getWitchingDay } from "@/api"
import { type JknTableProps, JknTable } from "@/components"
import { dateToWeek } from "@/utils/date"
import { useQuery } from "@tanstack/react-query"
import Decimal from "decimal.js"
import { useMemo } from "react"

export const WitchingDay = () => {
  const query = useQuery({
    queryKey: [getWitchingDay.cacheKey],
    queryFn: getWitchingDay,
  })


  const columns = useMemo<JknTableProps<any>['columns']>(() => [
    {
      header: () => <span className="text-stock-up" >一季度</span>, accessorKey: '0', enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => <span className="text-white inline-block my-2">{row.original[0]} ({dateToWeek(row.original[0], '周')})</span>
    },
    {
      header: () => <span className="text-stock-up" >二季度</span>, accessorKey: '1', enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => <span className="text-white inline-block my-2">{row.original[1]} ({dateToWeek(row.original[1], '周')})</span>
    },
    {
      header: () => <span className="text-stock-up" >三季度</span>, accessorKey: '2', enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => <span className="text-white inline-block my-2">{row.original[2]} ({dateToWeek(row.original[2], '周')})</span>
    },
    {
      header: () => <span className="text-stock-up" >四季度</span>, accessorKey: '3', enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => <span className="text-white inline-block my-2">{row.original[3]} ({dateToWeek(row.original[3], '周')})</span>
    },
  ], [])

  const rateColumns = useMemo<JknTableProps<any>['columns']>(() => [
    {
      header: () => '', accessorKey: '0', enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => <span className="inline-block my-2">{row.original[0]}</span>
    },
    {
      header: () => <span className="text-stock-up" >前一个交易日</span>, accessorKey: '1', enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => <span className="inline-block my-2">{row.original[1] ? Decimal.create(row.original[1]).mul(100).toFixed(2) : '--'}%</span>
    },
    {
      header: () => <span className="text-stock-up" >四巫日(当日)</span>, accessorKey: '2', enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => <span className="inline-block my-2">{row.original[2] ? Decimal.create(row.original[2]).mul(100).toFixed(2) : '--'}%</span>
    },
    {
      header: () => <span className="text-stock-up" >后一个交易日</span>, accessorKey: '3', enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => <span className="inline-block my-2">{row.original[3] ? Decimal.create(row.original[3]).mul(100).toFixed(2) : '--'}%</span>
    },
    {
      header: () => <span className="text-stock-up" >四巫日(当周)</span>, accessorKey: '4', enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => <span className="inline-block my-2">{row.original[4] ? Decimal.create(row.original[4]).mul(100).toFixed(2) : '--'}%</span>
    },
    {
      header: () => <span className="text-stock-up" >下一周</span>, accessorKey: '5', enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => <span className="inline-block my-2">{row.original[5] ? Decimal.create(row.original[5]).mul(100).toFixed(2) : '--'}%</span>
    },
  ], [])

  const qwDay = useMemo(() => {
    const r = []

    for (let i = 0; i < 4; i++) {
      r.push(query.data?.date.items[i] ?? '--')
    }

    return [r]
  }, [query.data])

  const qwRateDate = useMemo(() => [
    ['最近一年', ...query.data?.beforeYear ?? []],
    ['最近两年', ...query.data?.beforeTwoYear ?? []],
    ['最近三年', ...query.data?.beforeThreeYear ?? []]
  ], [query.data])


  return (
    <div className="w-[900px] box-border px-8 py-4 mx-auto h-full overflow-y-auto">
      <p className="text-center text-lg">巫日 - Witching Day</p>
      <p className="text-sm bg-background p-4">
        巫日是指美国股市于每年三月、六月、九月和十二月的第三个星期五，是衍生性金融商品到期结算日。当日最后交易小时称
        为四巫小时，为纽约时间下午三时至四时。<br />
        到期结算的商品共有四类：股票指数期货、股票指数期权、期权、个股期货，故称巫目。
      </p>

      <div className="text-stock-up mt-12">
        <div className="mb-12 pt-1">
          <p className="text-center text-lg bg-background m-0 py-3">{query.data?.date.year ?? '--'}年巫日</p>
          <JknTable columns={columns} data={qwDay} rowKey="id" />
        </div>

        <div className="mb-12 pt-1">
          <p className="text-center text-lg bg-background m-0 py-3">{query.data?.date.year ?? '--'}年巫日前后上涨概率</p>
          <JknTable columns={rateColumns} data={qwRateDate} rowKey="id" />
        </div>
      </div>

      <div className="flex items-center text-stock-up">
        <div className="w-3 self-stretch bg-stock-up py-2 box-border mr-3" />
        潜在影响：
      </div>
      <div className="text-foreground text-sm my-4">
        巫日的主要影响是造成交易量大幅增加。这是因为价内期权合约自动到期，促使整体市场的交易量增加。然而交易量的增加不
        一定会对市场产生影响。
      </div>
    </div>
  )
}