
import AssetsTop from '../components/top';
import AssetsInfo from '../components/info';
import Securitygroup from '../components/security-group';
import AiConfig from './ai-config'
import { useState } from "react";
import { stockUtils } from '@/utils/stock'
type TableDataType = ReturnType<typeof stockUtils.toStockWithExt>


import { MenuInline } from "@/components";
const AiTrading = () => {
    const [sharedData, setSharedData] = useState<TableDataType>(''); // 父组件管理共享状态
    const [list,setList] = useState<TableDataType[]>([])
    const onUpdate = (row: TableDataType, data: TableDataType[]) => {
        setSharedData(row)
        setList(data)
    }
    return <div className="pt-2.5 pb-5 pl-5 pr-8 box-border box-border min-h-screen flex flex-col">
        <div className='h-[1.75rem]'>
            <AssetsTop key={'assets-top'} />
        </div>
        <div className='flex flex-1 mt-[0.9375rem] w-full'>
            <div className='w-[12.5rem]'>
                <MenuInline key={'menu-inline'} />
            </div>
            <div className='flex-1 flex flex-col ml-8'>
                <div className=''>
                    <AssetsInfo key={'assets-info'} />
                </div>
                <div className='mt-5 flex flex-1'>
                    <Securitygroup onUpdate={onUpdate} />
                    <div className='ml-5 flex-1'>
                        <AiConfig key={'ai-config'} list={list} row={sharedData} />
                    </div>
                </div>
            </div>

        </div>

    </div>
}


export default AiTrading