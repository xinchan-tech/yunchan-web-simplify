import {
    TcRcTable,
    type TcRcTableProps,
    StockView,
    SubscribeSpan
} from '@/components'
import { getStockCollects, type StockRawRecord, getStockFinancials } from '@/api'
import { useTableData } from '@/hooks'
import { stockUtils } from '@/utils/stock'
import { useConfig, useTime } from '@/store'
import { type Stock, stockUtils } from '@/utils/stock'
import { useEffect, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/utils/style'
type TableDataType = ReturnType<typeof stockUtils.toStockWithExt>
const baseExtends: StockExtend[] = ['total_share', 'basic_index', 'day_basic', 'alarm_ai', 'alarm_all', 'financials']

const Securitygroup = ({ onUpdate, className, ...props }: { className?: string, onUpdate?: (data: TableDataType, row: TableDataType[]) => void }) => {
    const [active, setActive] = useState<string>()
    const [dates, setDates] = useState<string[]>([])
    const trading = useTime(s => s.getTrading())
    const [data, { onSort, setList }] = useTableData<TableDataType>([])

    const query = useQuery({
        queryKey: [getStockCollects.cacheKey],
        queryFn: () =>
            getStockCollects({
                cate_id: 1,
                limit: 300,
                extend: baseExtends
            })
    })

    useEffect(() => {
        if (!query.data) {
            setList([])
            return
        }

        const r: TableDataType[] = query.data.items.map(stock => {
            const lastStock = stockUtils.toStock(stock.stock, {
                extend: stock.extend,
                symbol: stock.symbol,
                name: stock.name
            })
            const beforeStock = stock.extend?.stock_before
                ? stockUtils.toStock(stock.extend?.stock_before as StockRawRecord, {
                    extend: stock.extend,
                    symbol: stock.symbol,
                    name: stock.name
                })
                : null
            const afterStock = stock.extend?.stock_after
                ? stockUtils.toStock(stock.extend?.stock_after as StockRawRecord, {
                    extend: stock.extend,
                    symbol: stock.symbol,
                    name: stock.name
                })
                : null

            const thumbs = lastStock?.thumbs ?? []

            const subStock: Stock | null = ['afterHours', 'close'].includes(trading) ? afterStock : beforeStock
   
            return {
                ...lastStock,
                name: stock.name,
                code: stock.symbol,
                thumbs,
                price: lastStock?.close,
                percent: subStock ? stockUtils.getPercent(lastStock) : undefined,
                subPrice: subStock?.close,
                subPercent: subStock ? stockUtils.getPercent(subStock) : undefined
            }
        })
        setList(r)
        onUpdate?.(r[0], r)
        console.log(r)
    }, [query.data, setList])


    const columns: TcRcTableProps<TableDataType>['columns'] = useMemo(
        () => [
            {
                title: '名称代码',
                dataIndex: 'code',
                align: 'left',
                width: '25%',
                sort: true,
                render: (_, row) => (
                    <div className="flex items-center h-[33px]">
                        <StockView name={row.name} code={row.code as string} showName />
                    </div>
                )
            },

            {
                title: '现价',
                dataIndex: 'price',
                align: 'left',
                width: '13.5%',
                sort: true,
                render: (_: any, row) => (
                    <SubscribeSpan.Price
                        showColor={false}
                        symbol=""
                        subscribe={false}
                        initValue={row.price}
                        decimal={3}
                        initDirection={row.isUp}
                        zeroText="--"
                    />
                )
            },
            {
                title: '涨跌幅',
                dataIndex: 'percent',
                align: 'left',
                width: '13%',
                sort: true,
                render: (_: any, row) => (
                    <SubscribeSpan.PercentBlink
                        symbol=""
                        subscribe={false}
                        decimal={2}
                        initValue={row.percent}
                        initDirection={row.isUp}
                        className={row.percent > 0 ? "text-[#5EDEA0]" : "text-[#FC43A8]"}
                        nanText="--"
                    />
                )
            }
        ],
        []
    )

    const onRowClick = (row: TableDataType) => {
        return {
            onClick: () => {
                onUpdate?.(row, data)
            }
        }
    }


    return <div className={cn("bg-[#1A191B] rounded-[2rem] px-0.5 py-6 w-[28.25rem] box-border", className)}>
        <div className="text-2xl flex flex-col ml-6 mt-2.5">
            <span>证券投资组合</span>
            <span className="text-sm">概述您的多元化股票投资组合。</span>
        </div>

        <div className="flex-1 overflow-hidden h-full">
            <TcRcTable
                rowKey="code"
                isLoading={query.isLoading}
                columns={columns}
                data={data}
                onSort={onSort}
                onRow={(row) => onRowClick(row)}
            />
        </div>
    </div>
}


export default Securitygroup