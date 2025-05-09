import type { getStockFinancialsStatistics } from '@/api'
import { type TcRcTableProps, NumSpan, SubscribeSpan } from '@/components'
import { cn } from '@/utils/style'
import Decimal from 'decimal.js'

// const columnHelper = createColumnHelper<ArrayItem<Awaited<ReturnType<typeof getStockFinancialsStatistics>>['items']>>()

export const financeTableColumns: TcRcTableProps<
  ArrayItem<Awaited<ReturnType<typeof getStockFinancialsStatistics>>['items']>
>['columns'] = [
  {
    title: '序号',
    dataIndex: 'index',
    rowSpan: 2,
    align: 'center',
    width: 60,
    render: (_, __, index) => index + 1
  },
  {
    title: '名称代码',
    dataIndex: 'symbol',
    rowSpan: 2,
    align: 'center',
    width: 100
  },
  {
    title: '发布时间',
    dataIndex: 'report_date',
    rowSpan: 2,
    align: 'center',
    width: 120
  },
  {
    title: (
      <span className="text-stock-green">
        财报市值
        <br />
        （当日）
      </span>
    ),
    align: 'center',
    dataIndex: 'total_mv',
    rowSpan: 2,
    width: 120,
    render: value => Decimal.create(value).toShortCN(2)
  },
  {
    title: '财务统计',
    align: 'center',
    key: 'finance',
    children: [
      {
        title: <span className="text-[#3861f7]">营收</span>,
        align: 'center',
        dataIndex: 'revenues',
        render: value => (
          <span className="text-[#3861f7] block bg-[#171d2f] h-8 leading-8">{Decimal.create(value).toShortCN(2)}</span>
        )
      },
      {
        title: <span className="text-[#3861f7]">同比</span>,
        align: 'center',
        dataIndex: 'revenues_rate',
        render: value => (
          <span className="text-[#3861f7] block bg-[#171d2f] h-8 leading-8">
            {Decimal.create(value).mul(100).toFixed(2)}%
          </span>
        )
      },
      {
        title: <span className="text-[#f0b400]">净利润</span>,
        align: 'center',
        dataIndex: 'net_income_loss',
        render: value => (
          <span className="text-[#f0b400] block bg-[#2a2517] h-8 leading-8">{Decimal.create(value).toShortCN(2)}</span>
        )
      },
      {
        title: <span className="text-[#f0b400]">同比</span>,
        align: 'center',
        dataIndex: 'net_income_loss_rate',
        render: value => (
          <span className="text-[#f0b400]  block bg-[#2a2517] h-8 leading-8">
            {Decimal.create(value).mul(100).toFixed(2)}%
          </span>
        )
      }
    ]
  },
  {
    title: '公布前后股价表现统计',
    align: 'center',
    key: 'cash',
    children: [
      {
        title: <span className="text-stock-up">前一日</span>,
        align: 'center',
        dataIndex: 'last_one_increase',
        render: value => (
          <SubscribeSpan.Percent symbol="" subscribe={false} initValue={value} initDirection={value >= 0} decimal={2} />
        )
      },
      {
        title: <span className="text-stock-up">当日涨幅</span>,
        align: 'center',
        dataIndex: 'increase',
        render: value => (
          <div className="bg-[#122420] h-full leading-8">
            <SubscribeSpan.Percent
              symbol=""
              subscribe={false}
              initValue={value}
              initDirection={value > 0}
              decimal={2}
            />
          </div>
        )
      },
      {
        title: <span className="text-stock-up">振幅</span>,
        align: 'center',
        dataIndex: 'amplitude',
        render: value => (
          <div className="bg-[#122420] h-full leading-8">
            <SubscribeSpan.Percent
              symbol=""
              subscribe={false}
              initValue={value}
              initDirection={value > 0}
              decimal={2}
            />
          </div>
        )
      },
      {
        title: <span className="text-stock-up">后一日</span>,
        align: 'center',
        dataIndex: 'next_one_increase',
        render: value => (
          <SubscribeSpan.Percent symbol="" subscribe={false} initValue={value} initDirection={value >= 0} decimal={2} />
        )
      }
    ]
  }
]
