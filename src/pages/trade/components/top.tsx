import assetTop from "@/assets/image/asset-top.png";
import { JknIcon } from '@/components'

const AssetsTop = () => {
    return <div className="flex items-center ">
        {/* <JknIcon.Svg name="asset-top" size={24} className='w-[8.9375rem] h-[1.75rem] ml-4 text-[#000]' /> */}
        <img className="w-[8.9375rem] h-[1.75rem] object-center" src={assetTop} alt="" />
        {/* <span className="text-base text-white font-bold">AiKuh</span>
            <JknIcon.Svg name="ai-icon" size={24} className='w-[1.5rem] ml-4' />
            <JknIcon.Svg name="frame" size={24} className='w-[1.5rem] ml-4' />
        <div className="ml-5 text-sm text-black  font-normal px-2 py-1 rounded-md bg-gradient-to-r from-green-400 to-blue-500">
            AI交易
        </div> */}
    </div>
}

export default AssetsTop