
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
    const [list, setList] = useState<TableDataType[]>([])
    const onUpdate = (row: TableDataType, data: TableDataType[]) => {
        setSharedData(row)
        setList(data)
    }
    return <div className='mt-5 flex flex-1 overflow-hidden'>
        <Securitygroup onUpdate={onUpdate} className='w-[40rem]' />
        <div className='ml-5 flex flex-1'>
            <AiConfig key={'ai-config'} list={list} row={sharedData} />
        </div>
    </div>

}


export default AiTrading