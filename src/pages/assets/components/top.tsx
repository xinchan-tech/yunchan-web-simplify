import imageLogo from "@/assets/image/logo.png";

const AssetsTop = () => {
    return <div className="flex items-center ">
        <img className="w-[24px] h-6 mr-1" src={imageLogo} alt="" />
        <span className="text-base text-white font-bold">AiKuh</span>
        <div className="ml-5 text-sm text-black  font-normal px-2 py-1 rounded-md bg-gradient-to-r from-green-400 to-blue-500 to-green-400">
            AI交易
        </div>
    </div>
}

export default AssetsTop