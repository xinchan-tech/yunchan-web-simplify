import { AlarmType, getAlarmLogs } from "@/api"
import { JknIcon, JknTable, type JknTableProps, StockView } from "@/components"
import { cn } from "@/utils/style"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

interface AlarmLogProps {
  type: AlarmType
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
        cell: ({ row }) => <StockView name={row.getValue('name')} code={row.getValue('symbol')} />
      }
    ]

    if (props.type === AlarmType.AI) {
      r.push({
        header: '报警类型', accessorKey: 'bull', enableSorting: false, meta: { align: 'right' },
        cell: ({ row }) => (
          <>
            <JknIcon name={row.getValue('bull') === '1' ? 'ic_price_up_green' : 'ic_price_down_red'} />
            <span className={cn(row.getValue('bull') === '1' ? 'text-stock-up' : 'text-stock-down')}>1</span>
          </>
        )
      })
    }

    r.push({
      header: props.type === AlarmType.AI ? '底部类型' : '提醒频率', accessorKey: 'bottom', size: 80, enableSorting: false, meta: { align: 'center' },
      cell: ({ row }) => <span className={cn(row.getValue('bull') === '1' ? 'text-stock-up' : 'text-stock-down')}>1</span>
    })

    r.push({
      header: '报警时间', accessorKey: 'create', size: 90, enableSorting: false, meta: { align: 'center' }
    })

    return r

  }, [props.type])

  return (
    <div>
      <JknTable columns={columns} data={query.data?.data || []} loading={query.isLoading} />
    </div>
  )
}

export default AlarmLog