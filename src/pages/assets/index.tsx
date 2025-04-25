import { Outlet } from "react-router";
import { Toaster } from '@/components'
import { MenuInline } from "@/components";
import AssetsTop from './components/top';
import AssetsInfo from './components/info';


const AssetsIndex = () => {
  return <div className="pt-2.5 pb-5 pl-5 pr-8 box-border box-border h-screen flex flex-col">
    <Toaster />

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
          <Outlet />
        </div>
      </div>

    </div>

  </div>

}

export default AssetsIndex;