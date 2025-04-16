import {
    JknRcTable,
    type JknRcTableProps,
    StockView,
    SubscribeSpan
} from '@/components'
import { useTableRowClickToStockTrading, useTableSortDataWithWs } from '@/hooks'
import { type StockTrading, stockUtils } from '@/utils/stock'
import { useEffect } from 'react'
type TableDataType = ReturnType<typeof stockUtils.toStockWithExt>
const Securitygroup = () => {

    const [list, { setList, onSort }] = useTableSortDataWithWs([{ name: '213', turnover: 123, marketValue: 123, symbol: '123' }], 'symbol', 'symbol')

    useEffect(() => {
        console.log('list', list)
        // setList([])
    }, [])

    const columns: JknRcTableProps<TableDataType>['columns'] = [
        {
            title: '名称代码',
            dataIndex: 'name',
            align: 'left',
            sort: true,
            render: (_, row) => <StockView className="min-h-[26px]" code={row.symbol} name={row.name} />
        },
        {
            title: '现价',
            dataIndex: 'turnover',
            align: 'right',
            sort: true,
            render: (turnover, row) => (
                <SubscribeSpan.TurnoverBlink
                    showColor={false}
                    trading={'intraDay'}
                    symbol={row.symbol}
                    decimal={2}
                    initValue={turnover}
                    initDirection={stockUtils.isUp(row)}
                />
            )
        },  
        {
            title: '涨跌幅',
            dataIndex: 'marketValue',
            align: 'right',
            sort: true,
        }
    ]

    const onRowClick = useTableRowClickToStockTrading('symbol')

    
    return <div className="border-[1px] border-[#3c3c3c] border-solid px-0.5 py-6 rounded-md w-[28.25rem]">
        <div className="text-2xl flex flex-col ml-6 mt-2.5">
            <span>证券投资组合</span>
            <span className="text-sm">概述您的多元化股票投资组合。</span>
        </div>

        <div className="flex-1 overflow-hidden">
            <JknRcTable
                rowKey="symbol"
                //   isLoading={query.isLoading}
                columns={columns}
                data={list}
                onSort={onSort}
                onRow={onRowClick}
            />
        </div>
    </div>
}


export default Securitygroup