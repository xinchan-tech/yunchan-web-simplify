import { getPaymentList } from "@/api"
import { JknRcTable } from "@/components"
import { useQuery } from "@tanstack/react-query"
import type { TableProps } from "rc-table"

const Bills = () => {
  const bills = useQuery({
    queryKey: [getPaymentList.cacheKey],
    queryFn: getPaymentList
  })

  const columns: TableProps['columns'] = [
    {
      title: '产品类型',
      dataIndex: 'name'
    },
    {
      title: '订单号',
      dataIndex: 'id'
    },
    {
      title: '支付方式',
      dataIndex: 'platform'
    },
    {
      title: '金额',
      dataIndex: 'price',
      render: (text) => <span>${text}</span>
    },
    {
      title: '购买时间',
      dataIndex: 'next_pay_time'
    },
    {
      title: '状态',
      dataIndex: 'subscribe_status_text',
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
    <div>
      <h3 className="text-[32px]">账单</h3>
      <div className="w-full h-full overflow-y-auto bg-background leading-none">
        <JknRcTable data={bills.data?.product || []} rowKey="id" columns={columns}  />
      </div>
    </div>
  )
}

export default Bills