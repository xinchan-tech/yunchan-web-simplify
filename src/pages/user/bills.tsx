import { getPaymentList } from '@/api'
import { JknRcTable, Separator } from '@/components'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { TableProps } from 'rc-table'

type TableDataType = ArrayItem<Awaited<ReturnType<typeof getPaymentList>>['product']>

const Bills = () => {
  const bills = useQuery({
    queryKey: [getPaymentList.cacheKey],
    queryFn: getPaymentList
  })

  const columns: TableProps<TableDataType>['columns'] = [
    {
      title: '产品类型',
      align: 'left',
      width: 134,
      dataIndex: 'name'
    },
    {
      title: '订单号',
      align: 'left',
      width: 240,
      dataIndex: 'order_sn'
    },
    {
      title: '支付方式',
      align: 'left',
      width: 125,
      dataIndex: 'platform'
    },
    {
      title: '金额',
      align: 'left',
      width: 130,
      dataIndex: 'price',
      render: text => <span>${text}</span>
    },
    {
      title: '购买时间',
      align: 'left',
      width: 226,
      dataIndex: 'create_time',
      render: text => <span className="leading-10">{dayjs(+text * 1000).format('YYYY/MM/DD HH:mm:ss')}</span>
    },
    {
      title: '状态',
      dataIndex: 'status_text',
      align: 'left',
      render: text => (
        <span>
          {{
            已到期: <span className="text-destructive">{text}</span>
          }[text as string] ?? text}
        </span>
      )
    }
  ]

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="text-[32px]">账单</div>
      <Separator className="my-10" />
      <div className="flex-1 leading-none ">
        <JknRcTable
          data={bills.data?.product || []}
          rowClassName={v => (v.status_text === '已取消' ? 'text-[#808080]' : '')}
          rowKey="id"
          columns={columns}
          isLoading={bills.isLoading}
          border={false}
        />
      </div>
    </div>
  )
}

export default Bills
