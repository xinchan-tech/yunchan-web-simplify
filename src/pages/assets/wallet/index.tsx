
import AssetsTop from '../components/top';
import AssetsInfo from '../components/info';
import Securitygroup from './security-group';
import ReportCurv from './report-curv';
import { MenuInline } from "@/components";


const Wallet = () => {
    return <div className="pt-2.5 pb-5 pl-5 pr-8 box-border box-border min-h-screen flex flex-col">
        <div className='h-[1.75rem]'>
        <AssetsTop />
        </div>
        <div className='flex flex-1 mt-[0.9375rem] w-full'>
            <div className='w-[12.5rem]'>
                <MenuInline />
            </div>
            <div className='flex-1 flex flex-col ml-8'>
                <div className=''>
                    <AssetsInfo />
                </div>
                <div className='mt-5 flex flex-1'>
                    <Securitygroup />
                    <div className='ml-5 flex-1'>
                        <ReportCurv />
                    </div>
                </div>
            </div>

        </div>

    </div>
}

export default Wallet