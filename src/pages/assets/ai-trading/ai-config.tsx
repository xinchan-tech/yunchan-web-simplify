import StockSelect from './stock-select'
import { type StockTrading, stockUtils } from '@/utils/stock'
type TableDataType = ReturnType<typeof stockUtils.toStockWithExt>
const AiConfig = ({ list, row }: { list: TableDataType[]; row: TableDataType }) => {
    return <div className="border-[1px] border-solid border-[#3c3c3c] rounded-md p-6">
        <div className="text-2xl font-bold">AI交易配置</div>
        <div className='mt-5'>
            <StockSelect list={list} row={row}/>
        </div>
    </div>
}

export default AiConfig