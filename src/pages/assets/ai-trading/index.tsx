
import AssetsTop from '../components/top';
import AssetsInfo from '../components/info';
import Securitygroup from './security-group';
import AiConfig from './ai-config.tsx'
import { useState } from "react";
import { stockUtils } from '@/utils/stock'
type TableDataType = ReturnType<typeof stockUtils.toStockWithExt>


import { MenuInline } from "@/components";
const AiTrading = () => {
    const [sharedData, setSharedData] = useState<TableDataType>(''); // 父组件管理共享状态
    const onUpdate = (row: TableDataType) => {
        setSharedData(row)
    }
    return <div className='flex w-full overflow-hidden'>
        <div className='h-full'>
        <AiConfig className='h-full px-10 box-border' key={'ai-config'} row={sharedData} />
        </div>
        <div className='ml-5 flex flex-1'>
            <Securitygroup onUpdate={onUpdate} className='w-full px-5 box-border' />
        </div>
    </div>

}


export default AiTrading