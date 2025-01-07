import { getStockHoliday } from "@/api"
import { CapsuleTabs, JknDatePicker, JknTable, type JknTableProps } from "@/components"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useMemo, useState } from "react"

type TableDataType = Awaited<ReturnType<typeof getStockHoliday>>[0]

const Holidays = () => {
  const [active, setActive] = useState(dayjs().format('YYYY'))
  const queryData = [dayjs(active).startOf('year').format('YYYY-MM-DD'), dayjs(active).endOf('year').format('YYYY-MM-DD')]
  const query = useQuery({
    queryKey: [getStockHoliday.cacheKey, ...queryData],
    queryFn: () => getStockHoliday(queryData[0], queryData[1])
  })
  const columns = useMemo<JknTableProps<TableDataType>['columns']>(() => [
    {
      header: '交易所', enableSorting: false, accessorKey: 'exchange', meta: { align: 'center' },
      cell: ({ row }) => <span className="text-white inline-block my-4">{row.original.exchange}</span>
    },
    {
      header: '日期', enableSorting: false, accessorKey: 'date', meta: { align: 'center' }
    },
    {
      header: '节日', enableSorting: false, accessorKey: 'name', meta: { align: 'center' }
    },
    {
      header: '状态', enableSorting: false, accessorKey: 'status', meta: { align: 'center' }
    }
  ], [])

  return (
    <div>
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
      <div className="w-[960px] mx-auto">
        <JknTable columns={columns} data={query.data ?? []} />
      </div>
    </div>
  )
}

export default Holidays