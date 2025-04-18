import AssetsTop from '../components/top';
import AssetsInfo from '../components/info';
import { MenuInline } from "@/components";
import HistoryList from './list';

const HistoryIndex= () => {
    return <div className="pt-2.5 pb-5 pl-5 pr-8 box-border box-border h-screen flex flex-col">
        <div className='h-[1.75rem]'>
            <AssetsTop />
        </div>
        <div className='flex flex-1 mt-[0.9375rem] w-full overflow-hidden'>
            <div className='w-[12.5rem]'>
                <MenuInline />
            </div>
            <div className='flex-1 flex flex-col ml-8'>
                <div className=''>
                    <AssetsInfo />
                </div>
                <div className='mt-5 flex flex-1 overflow-hidden'>
                    <HistoryList />
                </div>
            </div>
        </div>
    </div>
}

export default HistoryIndex