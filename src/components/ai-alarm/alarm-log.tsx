import { AlarmType, getAlarmLogs } from '@/api'
import { JknIcon, JknRcTable, type JknRcTableProps, StockView } from '@/components'
import { cn } from '@/utils/style'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

interface AlarmLogProps {
  type: AlarmType
}

type TableDataType = {
  index: number
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
    queryFn: () => getAlarmLogs({ type: props.type, limit: 300, page: 1 })
  })

  const columns = useMemo(() => {
    const r: JknRcTableProps['columns'] = [
      {
        title: '序号',
        dataIndex: 'index',
        align: 'center',
        width: 40,
        render: (_, row) => row.index
      },
      {
        title: '名称代码',
        dataIndex: 'symbol',
        align: 'left',
        width: 'auto',
        render: (_, row) => <StockView name={row.symbol} code={row.symbol} />
      },
      {
        title: '报警类型',
        dataIndex: 'alarmType',
        align: 'right',
        render: (_, row) => (
          <div className="flex items-center justify-end">
            <JknIcon name={row.bull === '1' ? 'ic_price_up_green' : 'ic_price_down_red'} />
            <span className={cn(row.bull === '1' ? 'text-stock-up' : 'text-stock-down')}>{row.alarmType}</span>
          </div>
        )
      },
      {
        title: props.type === AlarmType.AI ? '底部类型' : '提醒频率',
        dataIndex: 'bottom',
        width: 120,
        align: 'center',
        render: (_, row) => (
          <span className={cn(row.bull === '1' ? 'text-stock-up' : 'text-stock-down')}>{row.bottom ?? '--'}</span>
        )
      }
    ]

    if (props.type === AlarmType.AI) {
      ;(r as any[]).splice(2, 0, {
        title: '周期',
        dataIndex: 'cycle',
        align: 'right',
        width: 60,
        render: (_: any, row: any) => <span>{row.cycle}分</span>
      })
    }
    ;(r as any[]).push({
      title: '报警时间',
      dataIndex: 'create',
      width: 120,
      align: 'center',
      render: (create: string) => <span>{create.slice(5)}</span>
    })

    return r
  }, [props.type])

  const data = (() => {
    const r: TableDataType[] = []
    query.data?.items?.forEach(
      (
        { condition: { indicators, frequency, price, hdly, trigger, bull }, id, alarm_time, symbol, stock_cycle },
        index,
        arr
      ) => {
        const _bull = props.type === AlarmType.AI ? bull : trigger === 2 ? '1' : '2'
        const alarmType = props.type === AlarmType.AI ? indicators : (_bull === '1' ? '涨到' : '跌到') + price
        const bottom = props.type === AlarmType.AI ? hdly : frequency === 0 ? '仅提醒一次' : '持续提醒'
        r.push({
          index: arr.length - index,
          id,
          cycle: stock_cycle ?? '-',
          alarmType: alarmType ?? '',
          bottom: bottom,
          bull: _bull ?? '',
          symbol,
          create: alarm_time
        })
      }
    )
    return r
  })()

  return (
    <div className="h-full overflow-hidden">
      <JknRcTable columns={columns} data={data} isLoading={query.isLoading} rowKey="id" />
    </div>
  )
}

export default AlarmLog
