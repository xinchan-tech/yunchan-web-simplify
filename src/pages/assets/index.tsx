import { Outlet } from "react-router";
import { Toaster } from '@/components'
import { MenuInline } from "@/components";
import AssetsTop from './components/top';
import AssetsInfo from './components/info';
import { AuthGuard } from "@/components"


const AssetsIndex = () => {
  return <AuthGuard>
    <div className="p-5 box-border box-border h-screen flex flex-col">
      <Toaster />
      <div className='flex flex-1 pt-[0.9375rem] w-full h-full box-border overflow-hidden'>

        <div className='flex flex-col w-[14.5rem] py-[2.5rem] px-[1.25rem] bg-[#1A191B] rounded-[2rem]'>
          <AssetsTop />
          <div className="mt-[3.75rem]">
            <MenuInline />
          </div>
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
  </AuthGuard>
}

export default AssetsIndex;