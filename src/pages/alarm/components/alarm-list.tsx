import { getAlarmsGroup, getAlarms, deleteAlarm } from "@/api"
import { CapsuleTabs, type JknTableProps, StockView, NumSpan, JknIcon, JknTable, Popover, PopoverAnchor, PopoverClose, PopoverContent, PopoverTrigger, ScrollArea, Button } from "@/components"
import { useToast } from "@/hooks"
import { useStock } from "@/store"
import { numToFixed, priceToCnUnit } from "@/utils/price"
import { cn } from "@/utils/style"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useMemo, useState } from "react"

interface AlarmListProps {
  type: string
}

const AlarmList = (props: AlarmListProps) => {
  const [viewType, setViewKey] = useState('list')
  return (
    <div className="h-full flex flex-col">
      <div className="border-0 border-b border-solid border-border py-1">
        <CapsuleTabs type="text" activeKey={viewType} onChange={setViewKey}>
          <CapsuleTabs.Tab label="报警列表" value="list" />
          <CapsuleTabs.Tab label="已触发报警" value="log" />
        </CapsuleTabs>
      </div>
      <div className="flex flex-1">
        <div className="flex-1 flex-shrink-0 overflow-hidden">
          <GroupAlarm type={props.type} />
        </div>
        <div className="flex-shrink-0 w-1 h-full bg-accent" />
        <div className="flex-1 flex-shrink-0 overflow-hidden">
          <AlarmGroupList type={props.type} symbol="AA" />
        </div>
      </div>
    </div>
  )
}

export default AlarmList

interface AlarmItemProps {
  type: string
}
const GroupAlarm = (props: AlarmItemProps) => {
  const query = useQuery({
    queryKey: [getAlarmsGroup.cacheKey, props.type],
    queryFn: () => getAlarmsGroup({ type: +props.type, extend: ['total_share'] }),
  })
  const stock = useStock()

  type TableDataType = {
    code: string
    name: string
    price: number
    percent: number
    volume: number
    marketValue: number
  }

  const columns = useMemo<JknTableProps<TableDataType>['columns']>(() => [
    { header: '序号', accessorKey: 'index', size: 50, enableSorting: false, cell: ({ row }) => <span className="block py-1">{row.index + 1}</span>, meta: { align: 'center' } },
    {
      header: '股票代码', accessorKey: 'name', size: 120,
      cell: ({ row }) => <StockView code={row.original.code} name={row.original.name} />
    },
    {
      header: '股票名称', accessorKey: 'price', meta: { align: 'right' },
      cell: ({ row }) => <NumSpan value={numToFixed(row.original.price, 3) ?? 0} isPositive={row.original.percent > 0} />
    },
    {
      header: '涨跌幅', accessorKey: 'percent', meta: { align: 'right' },
      cell: ({ row }) => <NumSpan symbol block percent value={numToFixed(row.original.percent, 3) ?? 0} isPositive={row.original.percent > 0} />
    },
    {
      header: '成交额', accessorKey: 'volume', meta: { align: 'right' },
      cell: ({ row }) => <span >{priceToCnUnit(row.original.volume)} </span>
    },
    {
      header: '总市值', accessorKey: 'marketValue', meta: { align: 'right' },
      cell: ({ row }) => <NumSpan unit value={row.original.marketValue} isPositive={row.original.percent > 0} />
    },
    {
      header: (row) => (
        <div className="flex justify-center items-center gap-2">
          <Popover open={row.table.getSelectedRowModel().rows.length > 0}>
            <PopoverAnchor>
              <span>操作</span>
            </PopoverAnchor>
            <PopoverContent side="left" align="start" sideOffset={-20} alignOffset={30} className='w-auto px-4'>
              <div className="text-center py-1 bg-background">
                批量操作 {row.table.getSelectedRowModel().rows.length} 项
              </div>
              <div className='flex my-4 bg-muted gap-2'>
                <span>批量删除</span>
                <Button onClick={() => row.table.resetRowSelection()} size="mini" variant="outline">取消</Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="mini" variant="destructive">删除</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto px-4">
                    <div className="text-center py-1 bg-background">
                      确定删除吗
                    </div>
                    <div className="items-center justify-center flex my-4 bg-muted gap-2">
                      <PopoverClose asChild><Button size="mini" variant="outline">取消</Button></PopoverClose>
                      <Button size="mini" onClick={() => row.table.options.meta?.emit({ event: 'delete', params: row.table.getSelectedRowModel().rows.map(item => item.original.code) })}>确定</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </PopoverContent>
          </Popover>
          <JknIcon name={row.table.getSelectedRowModel().rows.length > 0 ? 'checkbox_mult_sel' : 'checkbox_mult_nor'} />
        </div>
      ),
      enableSorting: false, accessorKey: 'action', meta: { align: 'center' },
      cell: ({ row, table }) => (
        <div className="flex justify-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="icon">
                <JknIcon name="del" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto">
              <div className="text-center py-1 bg-background">
                删除确认
              </div>
              <div className="my-4 bg-muted px-4">
                <div>
                  确定删除 {row.original.code} 的所有报警？
                </div>
                <div className="items-center justify-center flex gap-2 mt-4">
                  <PopoverClose asChild><Button size="mini" variant="outline">取消</Button></PopoverClose>
                  <Button size="mini" onClick={() => table.options.meta?.emit({ event: 'deleteOne', params: row.original.code })}>确定</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <JknIcon onClick={() => row.toggleSelected()} name={row.getIsSelected() ? 'checkbox_mult_sel' : 'checkbox_mult_nor'} />
        </div>
      )
    }
  ], [])

  const data = (() => {
    const r: TableDataType[] = []
    for (const { name, symbol } of query.data?.items || []) {
      const lastData = stock.getLastRecordByTrading(symbol, 'intraDay')
      r.push({
        code: symbol,
        name: name,
        price: lastData?.close ?? 0,
        percent: lastData?.percent ?? 0,
        marketValue: lastData?.marketValue ?? 0,
        volume: (lastData?.volume ?? 0),
      })
    }
    return r
  })()

  const _onEvent: JknTableProps['onEvent'] = ({ event, params }) => {
  }

  return (
    <ScrollArea className="h-full">
      <JknTable rowKey="code" data={data} columns={columns} onEvent={_onEvent} />
    </ScrollArea>
  )
}

interface AlarmGroupListProps {
  type: string
  symbol: string
}

const AlarmGroupList = (props: AlarmGroupListProps) => {
  const options = {
    queryKey: [getAlarms.cacheKey, props.type, props.symbol],
    queryFn: () => getAlarms({ type: +props.type, limit: 1000, page: 1, symbol: props.symbol }),
  }
  const query = useQuery(options)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const deleteAlarmMutation = useMutation({
    mutationFn: async (params: { ids: string[], type: string }) => deleteAlarm({ ids: params.ids, type: params.type }),
    onMutate: async (params) => {
      await queryClient.cancelQueries(options)

      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof getAlarms>>>(options.queryKey)
  
      if (previous) {
        queryClient.setQueryData(options.queryKey, {
          ...previous,
          items: previous.items.filter(item => !params.ids.includes(item.id))
        })
      }

      return { previous }
    },
    onError: (err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData<Awaited<ReturnType<typeof getAlarms>>>(options.queryKey, context.previous)
      }

      if (err) {
        toast({ description: err.message })
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: options.queryKey })
    }
  })

  type TableDataType = {
    id: string
    cycle: string
    alarmType: string
    bull: string
    bottom?: string
    create: string
  }

  const columns = useMemo<JknTableProps<TableDataType>['columns']>(() => [
    { header: '序号', accessorKey: 'index', size: 40, enableSorting: false, cell: ({ row }) => <span className="block py-1">{row.index + 1}</span>, meta: { align: 'center' } },
    {
      header: '周期', accessorKey: 'cycle', size: 120, enableSorting: false,
      cell: ({ row }) => <span>{row.getValue('cycle')}分</span>
    },
    {
      header: '报警类型', accessorKey: 'bull', enableSorting: false, meta: { align: 'right' },
      cell: ({ row }) => (
        <>
          <JknIcon name={row.getValue('bull') === '1' ? 'ic_price_up_green' : 'ic_price_down_red'} />
          <span className={cn(row.getValue('bull') === '1' ? 'text-stock-up' : 'text-stock-down')}>{row.original.alarmType}</span>
        </>
      )
    },
    {
      header: '底部类型', accessorKey: 'bottom', size: 80, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => <span className={cn(row.getValue('bull') === '1' ? 'text-stock-up' : 'text-stock-down')}>{row.original.bottom ?? '-'}</span>
    },
    {
      header: '添加时间', accessorKey: 'create', size: 90, enableSorting: false, meta: { align: 'center' }
    },
    {
      header: (row) => (
        <div className="flex justify-center items-center gap-2">
          <Popover open={row.table.getSelectedRowModel().rows.length > 0}>
            <PopoverAnchor>
              <span>操作</span>
            </PopoverAnchor>
            <PopoverContent side="left" align="start" sideOffset={-20} alignOffset={30} className='w-auto px-4'>
              <div className="text-center py-1 bg-background">
                批量操作 {row.table.getSelectedRowModel().rows.length} 项
              </div>
              <div className='flex my-4 bg-muted gap-2'>
                <span>批量删除</span>
                <Button onClick={() => row.table.resetRowSelection()} size="mini" variant="outline">取消</Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="mini" variant="destructive">删除</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto px-4">
                    <div className="text-center py-1 bg-background">
                      确定删除吗
                    </div>
                    <div className="items-center justify-center flex my-4 bg-muted gap-2">
                      <PopoverClose asChild><Button size="mini" variant="outline">取消</Button></PopoverClose>
                      <Button size="mini" onClick={() => row.table.options.meta?.emit({ event: 'delete', params: row.table.getSelectedRowModel().rows.map(item => item.original.id) })}>确定</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </PopoverContent>
          </Popover>
          <JknIcon onClick={row.table.getToggleAllRowsSelectedHandler()} name={row.table.getSelectedRowModel().rows.length > 0 ? 'checkbox_mult_sel' : 'checkbox_mult_nor'} />
        </div>
      ), size: 90, enableSorting: false, accessorKey: 'action', meta: { align: 'center' },
      cell: ({ row, table }) => (
        <div className="flex justify-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="icon">
                <JknIcon name="del" className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto">
              <div className="text-center py-1 bg-background">
                删除确认
              </div>
              <div className="my-4 bg-muted px-12">
                <div>
                  确定删除报警？
                </div>
                <div className="items-center justify-center flex gap-2 mt-4">
                  <PopoverClose asChild><Button size="mini" variant="outline">取消</Button></PopoverClose>
                  <Button size="mini" onClick={() => table.options.meta?.emit({ event: 'deleteOne', params: row.original.id })}>确定</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <JknIcon onClick={() => row.toggleSelected()} name={row.getIsSelected() ? 'checkbox_mult_sel' : 'checkbox_mult_nor'} />
        </div>
      )
    }
  ], [])

  const data = (() => {
    const r: TableDataType[] = []
    for (const { condition: { bull, category_names, category_hdly_names }, stock_cycle, id, create_time } of query.data?.items || []) {
      r.push({
        id,
        cycle: stock_cycle,
        alarmType: category_names[0],
        bottom: category_hdly_names?.[0],
        bull: bull,
        create: dayjs(+create_time * 1000).format('MM-DD HH:mm')
      })
    }
    return r
  })()

  const onTableEvent: JknTableProps['onEvent'] = async ({ event, params }) => {
    if (event === 'deleteOne') {
      deleteAlarmMutation.mutate({ ids: [params], type: props.type })
    } else if (event === 'delete') {
      deleteAlarmMutation.mutate({ ids: params, type: props.type })
    }
  }



  return (
    <ScrollArea className="h-full">
      <JknTable onEvent={onTableEvent} rowKey="id" data={data} columns={columns} />
    </ScrollArea>
  )
}