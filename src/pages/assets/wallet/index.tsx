import Securitygroup from './security-group';
import ReportCurv from './report-curv';
import { type StockTrading, stockUtils } from '@/utils/stock'
import { useState } from "react";
type TableDataType = ReturnType<typeof stockUtils.toStockWithExt>

const Wallet = () => {
    const [sharedData, setSharedData] = useState<TableDataType>(''); // 父组件管理共享状态

    const onUpdate = (row: TableDataType, data: TableDataType[]) => {
        setSharedData(row)
    }

    return <div className='flex flex-1 overflow-hidden'>
        <Securitygroup onUpdate={onUpdate} />
        <div className='ml-5 flex-1'>
            <ReportCurv rowdata={sharedData} />
        </div>
    </div>

}

export default Wallet