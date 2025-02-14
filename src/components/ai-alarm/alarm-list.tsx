import { AlarmType, deleteAlarm, getAlarms, getAlarmsGroup } from '@/api'
import {
  Button,
  JknIcon,
  JknRcTable,
  type JknRcTableProps,
  Popover,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  StockView,
  SubscribeSpan
} from '@/components'
import { useCheckboxGroup, useTableData, useToast } from '@/hooks'
import { router } from '@/router'
import { type Stock, stockUtils } from '@/utils/stock'
import { cn } from '@/utils/style'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'

interface AlarmListProps {
  type: AlarmType
  options?: boolean
  onUpdateCount?: (count: number) => void
}

const AlarmList = (props: AlarmListProps) => {
  const [activeSymbol, setActiveSymbol] = useState<string>()
  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex-shrink-0 overflow-hidden">
        <GroupAlarm
          type={props.type}
          options={props.options}
          onChange={setActiveSymbol}
          onUpdateCount={props.onUpdateCount}
        />
      </div>
      <div className="flex-shrink-0 w-1 h-full bg-accent" />
      <div className="flex-1 flex-shrink-0 overflow-hidden">
        <AlarmGroupList type={props.type} options={props.options} symbol={activeSymbol} />
      </div>
    </div>
  )
}

export default AlarmList

interface AlarmItemProps {
  type: AlarmType
  options?: boolean
  onUpdateCount?: (count: number) => void
  onChange?: (symbol?: string) => void
}
const GroupAlarm = (props: AlarmItemProps) => {
  const options = {
    queryKey: [getAlarmsGroup.cacheKey, props.type],
    queryFn: () => getAlarmsGroup({ type: +props.type, extend: ['total_share'] })
  }
  const query = useQuery(options)

  const [list, { setList, onSort }] = useTableData<Stock>([], 'symbol')

  useEffect(() => {
    if (query.data) {
      props.onChange?.(query.data.items[0]?.symbol)
      props.onUpdateCount?.(query.data.total_nums)
    }
  }, [query.data, props.onChange, props.onUpdateCount])

  useEffect(() => {
    if (!query.data) {
      setList([])
      return
    }
    setList(
      query.data.items.map(item => {
        const s = stockUtils.toStock(item.stock, { extend: item.extend, symbol: item.symbol, name: item.name })
        return {
          ...s,
          percent: stockUtils.getPercent(s),
          marketValue: stockUtils.getMarketValue(s)
        }
      })
    )
  }, [query.data, setList])

  const { checked, toggle, setCheckedAll, getIsChecked } = useCheckboxGroup([])

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const deleteAlarmMutation = useMutation({
    mutationFn: async (params: { ids: string[]; type: AlarmType }) =>
      deleteAlarm({ symbols: params.ids, type: params.type }),
    onMutate: async params => {
      await queryClient.cancelQueries(options)

      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof getAlarmsGroup>>>(options.queryKey)

      if (previous) {
        queryClient.setQueryData(options.queryKey, {
          ...previous,
          items: previous.items.filter(item => !params.ids.includes(item.symbol))
        })
      }

      return { previous }
    },
    onError: (err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData<Awaited<ReturnType<typeof getAlarmsGroup>>>(options.queryKey, context.previous)
      }

      if (err) {
        toast({ description: err.message })
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: options.queryKey })
      setCheckedAll([])
    }
  })

  const columns = useMemo(() => {
    const c: JknRcTableProps<ArrayItem<typeof list>>['columns'] = [
      {
        title: '序号',
        dataIndex: 'index',
        align: 'center',
        width: 40,
        render: (_, __, index) => <span className="block py-1">{index + 1}</span>
      },
      {
        title: '股票代码',
        dataIndex: 'name',
        sort: true,
        render: (name, row) => <StockView code={row.symbol} name={name} />
      },
      {
        title: '现价',
        dataIndex: 'close',
        align: 'right',
        sort: true,
        render: (close, row) => (
          <SubscribeSpan.PriceBlink
            symbol={row.symbol}
            initValue={close}
            decimal={2}
            initDirection={stockUtils.isUp(row)}
          />
        )
      },
      {
        title: '涨跌幅',
        dataIndex: 'percent',
        align: 'right',
        sort: true,
        render: (percent, row) => (
          <SubscribeSpan.PercentBlockBlink
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
          <SubscribeSpan.TurnoverBlink showColor={false} symbol={row.symbol} decimal={2} initValue={turnover} />
        )
      },
      {
        title: '总市值',
        dataIndex: 'marketValue',
        align: 'right',
        sort: true,
        render: (marketValue, row) => (
          <SubscribeSpan.MarketValueBlink
            showColor={false}
            symbol={row.symbol}
            decimal={2}
            initValue={marketValue}
            totalShare={row.totalShare ?? 0}
          />
        )
      }
    ]

    if (props.options) {
      ;(c as any[]).push({
        title: (
          <div className="flex justify-center items-center gap-2">
            <Popover open={checked.length > 0}>
              <PopoverAnchor>
                <span>操作</span>
              </PopoverAnchor>
              <PopoverContent side="left" align="start" sideOffset={-20} alignOffset={30} className="w-auto px-4">
                <div className="text-center py-1 bg-background">批量操作 {checked.length} 项</div>
                <div className="flex my-4 bg-muted gap-2">
                  <span>批量删除</span>
                  <Button
                    onClick={() => {
                      setCheckedAll([])
                    }}
                    size="mini"
                    variant="outline"
                  >
                    取消
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="mini" variant="destructive">
                        删除
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto px-4">
                      <div className="text-center py-1 bg-background">确定删除吗</div>
                      <div className="items-center justify-center flex my-4 bg-muted gap-2">
                        <PopoverClose asChild>
                          <Button size="mini" variant="outline">
                            取消
                          </Button>
                        </PopoverClose>
                        <Button
                          size="mini"
                          onClick={() => deleteAlarmMutation.mutate({ ids: [...checked], type: props.type })}
                        >
                          确定
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </PopoverContent>
            </Popover>
            <JknIcon.Checkbox
              checked={checked.length > 0}
              onClick={() => setCheckedAll(checked.length > 0 ? [] : list.map(item => item.symbol))}
              className="rounded-none"
              checkedIcon="checkbox_mult_sel"
              uncheckedIcon="checkbox_mult_nor"
            />
          </div>
        ),
        dataIndex: 'action',
        align: 'center',
        width: 100,
        render: (_: any, row: any) => (
          <div className="flex justify-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="icon">
                  <JknIcon name="del" className="w-4 h-4 rounded-none" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto">
                <div className="text-center py-1 bg-background">删除确认</div>
                <div className="my-4 bg-muted px-4">
                  <div>确定删除 {row.symbol} 的所有报警？</div>
                  <div className="items-center justify-center flex gap-2 mt-4">
                    <PopoverClose asChild>
                      <Button size="mini" variant="outline">
                        取消
                      </Button>
                    </PopoverClose>
                    <PopoverClose asChild>
                      <Button
                        size="mini"
                        onClick={() => deleteAlarmMutation.mutate({ ids: [row.symbol], type: props.type })}
                      >
                        确定
                      </Button>
                    </PopoverClose>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <JknIcon.Checkbox
              className="rounded-none"
              checked={getIsChecked(row.symbol)}
              onClick={() => toggle(row.symbol)}
              checkedIcon="checkbox_mult_sel"
              uncheckedIcon="checkbox_mult_nor"
            />
          </div>
        )
      })
    } else {
      ;(c as any[]).splice(4, 1)
    }

    return c
  }, [props.options, checked, deleteAlarmMutation.mutate, list, getIsChecked, props.type, setCheckedAll, toggle])

  return (
    <div className="h-full overflow-hidden">
      <JknRcTable
        rowKey="symbol"
        onRow={row => ({
          onClick: () => props.onChange?.(row.symbol),
          onDoubleClick: () => router.navigate(`/stock/trading?symbol=${row.symbol}`)
        })}
        data={list}
        columns={columns}
        onSort={onSort}
      />
    </div>
  )
}

interface AlarmGroupListProps {
  type: AlarmType
  symbol?: string
  options?: boolean
}

const AlarmGroupList = (props: AlarmGroupListProps) => {
  const options = {
    queryKey: [getAlarms.cacheKey, props.type, props.symbol],
    queryFn: () => getAlarms({ type: +props.type, limit: 1000, page: 1, symbol: props.symbol }),
    enabled: !!props.symbol
  }

  const query = useQuery(options)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const deleteAlarmMutation = useMutation({
    mutationFn: async (params: { ids: string[]; type: AlarmType }) =>
      deleteAlarm({ ids: params.ids, type: params.type }),
    onMutate: async params => {
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
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: [getAlarmsGroup.cacheKey, props.type]
      })
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

  const { checked, toggle, setCheckedAll, getIsChecked } = useCheckboxGroup([])

  useEffect(() => {
    const r = checked.filter(item => query.data?.items.some(i => i.id === item))

    if (r.length !== checked.length) {
      setCheckedAll(r)
    }
  }, [query.data, checked, setCheckedAll])

  const data = (() => {
    const r: TableDataType[] = []
    for (const {
      condition: { bull, category_names, category_hdly_names, price, trigger, frequency },
      stock_cycle,
      id,
      create_time
    } of query.data?.items || []) {
      const _bull = props.type === AlarmType.AI ? bull : trigger === 2 ? '1' : '2'
      const alarmType = props.type === AlarmType.AI ? category_names?.[0] : (_bull === '1' ? '涨到' : '跌到') + price
      const bottom =
        props.type === AlarmType.AI ? category_hdly_names?.[0] : frequency === 0 ? '仅提醒一次' : '持续提醒'
      r.push({
        id,
        cycle: stock_cycle,
        alarmType: alarmType,
        bottom: bottom,
        bull: _bull,
        create: dayjs(+create_time * 1000).format('MM-DD HH:mm')
      })
    }
    return r
  })()

  const columns = useMemo(() => {
    const c: JknRcTableProps<TableDataType>['columns'] = [
      {
        title: '序号',
        dataIndex: 'index',
        render: (_, __, index) => <span className="block py-1">{index + 1}</span>,
        align: 'center',
        width: 40
      },
      {
        title: '周期',
        dataIndex: 'cycle',
        align: 'center',
        width: 80,
        render: (_, row) => <span>{row.cycle}分</span>
      },
      {
        title: '报警类型',
        dataIndex: 'bull',
        align: 'right',
        render: (_, row) => (
          <>
            <JknIcon name={row.bull === '1' ? 'ic_price_up_green' : 'ic_price_down_red'} />
            <span className={cn(row.bull === '1' ? 'text-stock-up' : 'text-stock-down')}>{row.alarmType}</span>
          </>
        )
      },
      {
        title: props.type === AlarmType.AI ? '底部类型' : '提醒频率',
        dataIndex: 'bottom',
        width: 80,
        align: 'center',
        render: (_, row) => (
          <span className={cn(row.bull === '1' ? 'text-stock-up' : 'text-stock-down')}>{row.bottom ?? '-'}</span>
        )
      },
      {
        title: '添加时间',
        dataIndex: 'create',
        width: 110,
        align: 'center'
      }
    ]

    if (props.options) {
      ;(c as any[]).push({
        title: (
          <div className="flex justify-center items-center gap-2">
            <Popover open={checked.length > 0}>
              <PopoverAnchor>
                <span>操作</span>
              </PopoverAnchor>
              <PopoverContent side="left" align="start" sideOffset={-20} alignOffset={30} className="w-auto px-4">
                <div className="text-center py-1 bg-background">批量操作 {checked.length} 项</div>
                <div className="flex my-4 bg-muted gap-2">
                  <span>批量删除</span>
                  <Button
                    onClick={() => {
                      setCheckedAll([])
                    }}
                    size="mini"
                    variant="outline"
                  >
                    取消
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="mini" variant="destructive">
                        删除
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto px-4">
                      <div className="text-center py-1 bg-background">确定删除吗</div>
                      <div className="items-center justify-center flex my-4 bg-muted gap-2">
                        <PopoverClose asChild>
                          <Button size="mini" variant="outline">
                            取消
                          </Button>
                        </PopoverClose>
                        <Button
                          size="mini"
                          onClick={() => deleteAlarmMutation.mutate({ ids: [...checked], type: props.type })}
                        >
                          确定
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </PopoverContent>
            </Popover>
            <JknIcon.Checkbox
              checked={checked.length > 0}
              onClick={() => setCheckedAll(checked.length > 0 ? [] : data.map(item => item.id))}
              className="rounded-none"
              checkedIcon="checkbox_mult_sel"
              uncheckedIcon="checkbox_mult_nor"
            />
          </div>
        ),
        dataIndex: 'action',
        align: 'center',
        width: 100,
        render: (_: any, row: any) => (
          <div className="flex justify-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="icon">
                  <JknIcon name="del" className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto">
                <div>
                  <div className="text-center py-1 bg-background">删除确认</div>
                  <div className="my-4 bg-muted px-12">
                    <div>确定删除报警？</div>
                    <div className="items-center justify-center flex gap-2 mt-4">
                      <PopoverClose asChild>
                        <Button size="mini" variant="outline">
                          取消
                        </Button>
                      </PopoverClose>
                      <PopoverClose asChild>
                        <Button
                          size="mini"
                          onClick={() => deleteAlarmMutation.mutate({ ids: [row.id], type: props.type })}
                        >
                          确定
                        </Button>
                      </PopoverClose>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <JknIcon.Checkbox
              className="rounded-none"
              checked={getIsChecked(row.id)}
              onClick={() => toggle(row.id)}
              checkedIcon="checkbox_mult_sel"
              uncheckedIcon="checkbox_mult_nor"
            />
          </div>
        )
      })
    }

    if (props.type !== AlarmType.AI) {
      ;(c as any[]).splice(1, 1)
    }

    return c
  }, [props.options, checked, data, deleteAlarmMutation.mutate, props.type, setCheckedAll, getIsChecked, toggle])

  // const onTableEvent: JknTableProps['onEvent'] = async ({ event, params }) => {
  //   if (event === 'deleteOne') {
  //     deleteAlarmMutation.mutate({ ids: [params], type: props.type })
  //   } else if (event === 'delete') {
  //     deleteAlarmMutation.mutate({ ids: params, type: props.type })
  //   }
  // }

  return (
    <div className="h-full overflow-hidden">
      <JknRcTable rowKey="id" data={data} columns={columns} />
    </div>
  )
}
