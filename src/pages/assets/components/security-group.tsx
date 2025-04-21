import {
    JknRcTable,
    type JknRcTableProps,
    StockView,
    SubscribeSpan
} from '@/components'
import { getStockFinancials } from '@/api'
import { useTableData } from '@/hooks'
import { stockUtils } from '@/utils/stock'
import { useEffect, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
type TableDataType = ReturnType<typeof stockUtils.toStockWithExt>
const Securitygroup = ({ onUpdate }: { onUpdate?: (data: TableDataType, row: TableDataType[]) => void }) => {
    const [active, setActive] = useState<string>()
    const [dates, setDates] = useState<string[]>([])
    const [data, { onSort, setList }] = useTableData<TableDataType>([])

    const query = useQuery({
        queryKey: [getStockFinancials.cacheKey, active === dates[0] ? undefined : active],
        queryFn: () =>
            getStockFinancials({
                'date[0]': active,
                'date[1]': active,
                limit: 300,
                extend: ['basic_index', 'financials', 'stock_before', 'stock_after', 'total_share', 'collect']
            })
    })

    useEffect(() => {
        if (query.data?.dates?.length) {
            setActive(query.data.dates[0])
            setDates(query.data.dates)
        }
    }, [query.data?.dates, active])

    useEffect(() => {
        const r: TableDataType[] = []
        if (!query.data?.items) {
            setList([])
            return
        }

        for (const { id, time, date, ...stock } of query.data.items) {
            const lastStock = stockUtils.toStockWithExt(stock.stock, {
                extend: stock.extend,
                name: stock.name,
                symbol: stock.symbol
            })
            const beforeStock = stockUtils.toStockWithExt(stock.extend?.stock_before, {
                extend: stock.extend,
                name: stock.name,
                symbol: stock.symbol
            })
            const afterStock = stockUtils.toStockWithExt(stock.extend?.stock_after, {
                extend: stock.extend,
                name: stock.name,
                symbol: stock.symbol
            })

            r.push({
                name: lastStock.name,
                code: lastStock.symbol,
                id,
                date: `${date.substring(5, 10)} ${time}`,
                price: lastStock?.close || undefined,
                percent: lastStock?.percent && lastStock.percent,
                turnover: lastStock?.turnover || undefined,
                total: lastStock?.marketValue || undefined,
                industry: lastStock?.industry,
                prePercent: beforeStock?.percent,
                afterPercent: afterStock?.percent,
                collect: lastStock?.extend?.collect,
                isUp: stockUtils.isUp(lastStock)
            })
        }
        setList(r)
        onUpdate?.(r[0], r)
    }, [query.data?.items, setList])

    const columns: JknRcTableProps<TableDataType>['columns'] = useMemo(
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
                onUpdate?.(row)
            }
        }
    }


    return <div className="border-[1px] border-[#3c3c3c] border-solid px-0.5 py-6 rounded-md w-[28.25rem]">
        <div className="text-2xl flex flex-col ml-6 mt-2.5">
            <span>证券投资组合</span>
            <span className="text-sm">概述您的多元化股票投资组合。</span>
        </div>

        <div className="flex-1 overflow-hidden h-full">
            <JknRcTable
                rowKey="id"
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