import { getPaymentList } from "@/api"
import { JknRcTable } from "@/components"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import type { TableProps } from "rc-table"

const Bills = () => {
  const bills = useQuery({
    queryKey: [getPaymentList.cacheKey],
    queryFn: getPaymentList
  })

  const columns: TableProps['columns'] = [
    {
      title: '产品类型',
      align: 'center',
      dataIndex: 'name'
    },
    {
      title: '订单号',
      align: 'center',
      dataIndex: 'id'
    },
    {
      title: '支付方式',
      align: 'center',
      dataIndex: 'platform'
    },
    {
      title: '金额',
      align: 'center',
      dataIndex: 'price',
      render: (text) => <span>${text}</span>
    },
    {
      title: '购买时间',
      align: 'center',
      dataIndex: 'create_time',
      render: (text) => <span>{dayjs(+text * 1000).format('YYYY-MM-DD HH:mm:ss')}</span>
    },
    {
      title: '状态',
      dataIndex: 'status_text',
      align: 'center',
      render: (text) => (
        <span>
          {{
            未生效: text,
            已生效: <span className="text-green-500">{text}</span>,
            已失效: <span className="text-red-500">{text}</span>,
          }[text as string] ?? text}
        </span>
      )
    }
  ]

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="text-[32px] mb-5">账单</div>
      <div className="flex-1 leading-none">
        <JknRcTable data={bills.data?.product || []} rowKey="id" columns={columns}  />
      </div>
    </div>
  )
}

export default Bills