import { getStockHoliday } from "@/api"
import { CapsuleTabs, JknDatePicker, JknRcTable, type JknRcTableProps } from "@/components"
import { useTime } from "@/store"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { time } from "echarts/core"
import { useCallback, useMemo, useState } from "react"

type TableDataType = Awaited<ReturnType<typeof getStockHoliday>>[0]

const Holidays = () => {
  const [active, setActive] = useState(dayjs().format('YYYY'))
  const queryData = [dayjs(active).startOf('year').format('YYYY-MM-DD'), dayjs(active).endOf('year').format('YYYY-MM-DD')]
  const query = useQuery({
    queryKey: [getStockHoliday.cacheKey, ...queryData],
    queryFn: () => getStockHoliday(queryData[0], queryData[1])
  })
  const getCurrentUsTime = useTime(s => s.getCurrentUsTime)

  const getColor = useCallback((date: string) => {
    const current = dayjs(getCurrentUsTime()).tz('America/New_York')
    const usDay = dayjs(date)
    if (current.format('YYYY-MM-DD') > usDay.format('YYYY-MM-DD')) {
      return '#5e5f61'
    }

    if (current.day(6).format('YYYY-MM-DD') >= usDay.format('YYYY-MM-DD')) {
      return 'hsl(var(--primary))'
    }

    return ''
  }, [getCurrentUsTime])

  const columns = useMemo<JknRcTableProps<TableDataType>['columns']>(() => [
    {
      title: '交易所', dataIndex: 'exchange', align: 'center',
      render: (_, row) => <span style={{color: getColor(row.date)}} className="text-white inline-block my-4">{row.exchange}</span>
    },
    {
      title: '日期', dataIndex: 'date', align: 'center',
      render: (_, row) => <span style={{color: getColor(row.date)}} className="text-white inline-block my-4">{row.date}</span>
    },
    {
      title: '节日', dataIndex: 'name', align: 'center',
      render: (_, row) => <span style={{color: getColor(row.date)}} className="text-white inline-block my-4">{row.name}</span>
    },
    {
      title: '状态', dataIndex: 'status', align: 'center',
      render: (_, row) => <span style={{color: getColor(row.date)}} className="text-white inline-block my-4">{row.status}</span>
    }
  ], [getColor])

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="py-1">
        <CapsuleTabs type="text" activeKey={active} onChange={setActive}>
          <CapsuleTabs.Tab label="今年" value={dayjs().format('YYYY')} />
          <CapsuleTabs.Tab label="明年" value={dayjs().add(1, 'year').format('YYYY')} />
          <JknDatePicker onChange={(date) => date && setActive(date)}>
            {
              (date, action) => <span className="inline-block w-24" onClick={() => action.open} onKeyDown={() => { }}><CapsuleTabs.Tab disabled label={date ?? '自定义'} value={date ?? 'manual'} /></span>
            }
          </JknDatePicker>
        </CapsuleTabs>

      </div>
      <div className="w-[960px] mx-auto flex-1 overflow-hidden">
        <JknRcTable columns={columns} data={query.data ?? []} />
      </div>
    </div>
  )
}

export default Holidays