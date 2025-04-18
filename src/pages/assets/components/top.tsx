import imageLogo from "@/assets/image/logo.png";
import { JknIcon } from '@/components'

const AssetsTop = () => {
    return <div className="flex items-center ">
        <img className="w-[24px] h-6 mr-1" src={imageLogo} alt="" />
        <span className="text-base text-white font-bold">AiKuh</span>
            {/* <JknIcon.Svg name="ai-icon" size={24} className='w-[1.5rem] ml-4' /> */}
        <div className="ml-5 text-sm text-black  font-normal px-2 py-1 rounded-md bg-gradient-to-r from-green-400 to-blue-500">
            AI交易
        </div>
    </div>
}

export default AssetsTop