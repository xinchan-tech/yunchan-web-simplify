import { Outlet } from "react-router";
import { Toaster } from '@/components'


const AssetsIndex = () => {
  return <div>
    <Toaster />
    <Outlet />
  </div>;
}

export default AssetsIndex;