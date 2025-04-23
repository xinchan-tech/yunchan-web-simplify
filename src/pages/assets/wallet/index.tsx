
import AssetsTop from '../components/top';
import AssetsInfo from '../components/info';
import Securitygroup from '../components/security-group';
import ReportCurv from './report-curv';
import { MenuInline } from "@/components";
import { type StockTrading, stockUtils } from '@/utils/stock'
import { useState } from "react";
type TableDataType = ReturnType<typeof stockUtils.toStockWithExt>

const Wallet = () => {
    const [sharedData, setSharedData] = useState<TableDataType>(''); // 父组件管理共享状态
    return <div className="pt-2.5 pb-5 pl-5 pr-8 box-border box-border h-screen flex flex-col">
        <div className='h-[1.75rem]'>
        <AssetsTop />
        </div>
        <div className='flex flex-1 pt-[0.9375rem] w-full h-full box-border overflow-hidden'>
            <div className='w-[12.5rem]'>
                <MenuInline />
            </div>
            <div className='flex-1 flex flex-col ml-8'>
                <div className=''>
                    <AssetsInfo />
                </div>
                <div className='mt-5 flex flex-1 overflow-hidden'>
                    <Securitygroup onUpdate={setSharedData} />
                    <div className='ml-5 flex-1'>
                        <ReportCurv rowdata={sharedData} />
                    </div>
                </div>
            </div>

        </div>

    </div>
}

export default Wallet