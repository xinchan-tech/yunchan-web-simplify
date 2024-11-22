import { AlarmType, getAlarmLogs } from "@/api"
import { JknIcon, JknTable, type JknTableProps, StockView } from "@/components"
import { cn } from "@/utils/style"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useMemo } from "react"

interface AlarmLogProps {
  type: AlarmType
}


type TableDataType = {
  id: string
  symbol: string
  cycle: string
  alarmType: string
  bull: string
  bottom?: string
  create: string
}

const AlarmLog = (props: AlarmLogProps) => {
  const query = useQuery({
    queryKey: [getAlarmLogs.cacheKey, props.type],
    queryFn: () => getAlarmLogs({ type: props.type, limit: 50, page: 1 }),
  })

  const columns = useMemo(() => {
    const r: JknTableProps['columns'] = [
      {
        header: '序号', accessorKey: 'index', meta: { align: 'center', width: 10 }, enableSorting: false,
        cell: ({ row }) => row.index + 1
      },
      {
        header: '名称代码', accessorKey: 'symbol', meta: { align: 'left', width: '15%' },
        cell: ({ row }) => <StockView name={row.getValue('symbol')} code={row.getValue('symbol')} />
      },
      {
        header: '报警类型', accessorKey: 'alarmType', enableSorting: false, meta: { align: 'right' },
        cell: ({ row }) => (
          <>
            <JknIcon name={row.original.bull === '1' ? 'ic_price_up_green' : 'ic_price_down_red'} />
            <span className={cn(row.original.bull === '1' ? 'text-stock-up' : 'text-stock-down')}>{row.getValue('alarmType')}</span>
          </>
        )
      },
      {
        header: props.type === AlarmType.AI ? '底部类型' : '提醒频率', accessorKey: 'bottom', size: 80, enableSorting: false, meta: { align: 'center' },
        cell: ({ row }) => <span className={cn(row.original.bull === '1' ? 'text-stock-up' : 'text-stock-down')}>{row.getValue('bottom')}</span>
      }
    ]

    if (props.type === AlarmType.AI) {
      r.splice(2, 0, {
        header: '周期', accessorKey: 'alarmType', enableSorting: false, meta: { align: 'right' },
        cell: ({ row }) => (
          <>
            <JknIcon name={row.getValue('alarmType') === '1' ? 'ic_price_up_green' : 'ic_price_down_red'} />
            <span className={cn(row.getValue('alarmType') === '1' ? 'text-stock-up' : 'text-stock-down')}>{row.getValue('alarmType')}</span>
          </>
        )
      },)
    }

    r.push({
      header: '报警时间', accessorKey: 'create', size: 90, enableSorting: false, meta: { align: 'center' }
    })

    return r

  }, [props.type])

  const data = (() => {
    const r: TableDataType[] = []
    for (const { condition: { category_name, frequency, price, category_hdly_name, trigger, bull }, id, alarm_time, symbol } of query.data?.items || []) {
      const _bull = props.type === AlarmType.AI ? bull : trigger === 2 ? '1' : '2'
      const alarmType = props.type === AlarmType.AI ? category_name : ((_bull === '1' ? '涨到' : '跌到') + price)
      const bottom = props.type === AlarmType.AI ? category_hdly_name : frequency === 0 ? '仅提醒一次' : '持续提醒'
      r.push({
        id,
        cycle: '',
        alarmType: alarmType ?? '',
        bottom: bottom,
        bull: _bull ?? '',
        symbol,
        create: alarm_time
      })
    }
    return r
  })()

  return (
    <div>
      <JknTable columns={columns} data={data} loading={query.isLoading} />
    </div>
  )
}

export default AlarmLog