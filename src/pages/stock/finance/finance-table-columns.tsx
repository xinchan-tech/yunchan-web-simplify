import type { getStockFinancialsStatistics } from "@/api"
import { type JknTableProps, NumSpan } from "@/components"
import { cn } from "@/utils/style"
import { createColumnHelper } from "@tanstack/react-table"
import Decimal from "decimal.js"

const columnHelper = createColumnHelper<ArrayItem<Awaited<ReturnType<typeof getStockFinancialsStatistics>>['items']>>()

export const financeTableColumns = [
  columnHelper.display({ id: 'index', header: '序号', meta: { rowSpan: 2, align: 'center', width: 60 }, cell: ({ row }) => row.index + 1 }),
  columnHelper.accessor('symbol', { header: '名称代码', meta: { rowSpan: 2, align: 'center', width: '100' }, enableSorting: false }),
  columnHelper.accessor('report_date', { header: '发布时间', meta: { rowSpan: 2, align: 'center', width: '120' }, enableSorting: false }),
  columnHelper.accessor('total_mv', {
    header: () => <span className="text-stock-green">财报市值<br />（当日）</span>,
    meta: { rowSpan: 2, align: 'center', width: '120' },
    enableSorting: false,
    cell: ({ cell }) => Decimal.create(cell.getValue()).toShortCN(2)
  }),
  columnHelper.group({
    id: 'finance',
    meta: { align: 'center' },
    header: () => <span className="text-stock-green">财务统计</span>,
    columns: [
      columnHelper.accessor('revenues', {
        header: () => <span className="text-[#3861f7]">营收</span>,
        meta: { align: 'center', cellClassName: '!p-0' },
        enableSorting: false,
        cell: ({ cell }) => <span className="text-[#3861f7] block bg-[#171d2f] h-8 leading-8">{Decimal.create(cell.getValue()).toShortCN(2)}</span>
      }),
      columnHelper.accessor('revenues_rate', {
        header: () => <span className="text-[#3861f7]">同比</span>,
        meta: { align: 'center', cellClassName: '!p-0' },
        enableSorting: false,
        cell: ({ cell }) => <span className="text-[#3861f7] block bg-[#171d2f] h-8 leading-8">{Decimal.create(cell.getValue()).mul(100).toFixed(2)}%</span>
      }),
      columnHelper.accessor('net_income_loss', {
        header: () => <span className="text-[#f0b400]">净利润</span>,
        meta: { align: 'center', cellClassName: '!p-0' },
        enableSorting: false,
        cell: ({ cell }) => <span className="text-[#f0b400] block bg-[#2a2517] h-8 leading-8">{Decimal.create(cell.getValue()).toShortCN(2)}</span>
      }),
      columnHelper.accessor('net_income_loss_rate', {
        header: () => <span className="text-[#f0b400]">同比</span>,
        meta: { align: 'center', cellClassName: '!p-0' },
        enableSorting: false,
        cell: ({ cell }) => <span className="text-[#f0b400]  block bg-[#2a2517] h-8 leading-8">{Decimal.create(cell.getValue()).mul(100).toFixed(2)}%</span>
      }),
    ]
  }),
  columnHelper.group({
    id: 'cash',
    header: () => <span className="text-stock-green">公布前后股价表现统计</span>,
    meta: { align: 'center' },
    columns: [
      columnHelper.accessor('last_one_increase', {
        header: () => <span className="text-stock-up">前一日</span>,
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ cell }) => <NumSpan value={cell.getValue() * 100} isPositive={cell.getValue() >= 0} percent decimal={2} />
      }),
      columnHelper.accessor('increase', {
        header: () => <span className="text-stock-up">当日涨幅</span>,
        meta: { align: 'center', cellClassName: '!p-0' },
        enableSorting: false,
        cell: ({ cell }) => <NumSpan block className={cn('bg-[#122420] h-8 leading-6', cell.getValue() >= 0 ? 'text-stock-up': 'text-stock-down')} value={cell.getValue() * 100} isPositive={cell.getValue() >= 0} percent decimal={2} />
      }),
      columnHelper.accessor('amplitude', {
        header: () => <span className="text-stock-up">振幅</span>,
        meta: { align: 'center', cellClassName: '!p-0' },
        enableSorting: false,
        cell: ({ cell }) => <NumSpan block className={cn('bg-[#122420] h-8 leading-6', cell.getValue() >= 0 ? 'text-stock-up': 'text-stock-down')} value={cell.getValue() * 100} isPositive={cell.getValue() >= 0} percent decimal={2} />
      }),
      columnHelper.accessor('next_one_increase', {
        header: () => <span className="text-stock-up">后一日</span>,
        meta: { align: 'center' },
        enableSorting: false,
        cell: ({ cell }) => <NumSpan value={cell.getValue() * 100} isPositive={cell.getValue() >= 0} percent decimal={2} />
      }),
    ]
  }),
] as JknTableProps<ArrayItem<Awaited<ReturnType<typeof getStockFinancialsStatistics>>['items']>>['columns']