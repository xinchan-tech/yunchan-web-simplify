import photo from '@/assets/image/back-result.png'
import { JknIcon } from '@/components'

const AssetsInfo = () => {

    const infoData = [
        {
            title: '可用金额',
            num: '$457,256.32',
            percent: '比例 25.35%',
            rate: ''
        },
        {
            title: '投资组合',
            num: '$457,256.32',
            percent: '比率 25.35%',
            rate: '+$1023.55'
        },
        {
            title: '当日回报',
            num: '$457,256.32',
            percent: '回报率 25.35%',
            rate: ''
        },
    ]

    return <div className="h-[11.25rem] border-[1px] border-solid box-border border-[#3D3D3D] rounded-[10px] py-[2.5rem] px-[1.5rem] w-full flex item-center">
        <div className="flex item-center flex-col justify-center">
            <img src={photo} alt="" className='w-[64px] h-[64px]' />
            <span>Assert</span>
        </div>
        <div className='ml-[2.5rem]'>
            <div className='px-[10px] py-[12px] box-border flex items-center justify-center bg-[#2962ff] rounded-[6px] w-[7.25rem] text-center font-sm cursor-pointer'>
                <JknIcon.Svg name="assets-add" size={24} />
                <span className='ml-1'>存款</span>
            </div>
            <div className='px-[10px] py-[12px] box-border flex items-center justify-center bg-[#2e2e2e] rounded-[6px] w-[7.25rem] text-center font-sm cursor-pointer mt-[10px] ' >
                <JknIcon.Svg name="assets-retreat" size={24} />
                <span className='ml-1'>撤退</span>
            </div>
        </div>
        <div className='border-[1px] border-solid box-border border-[#3D3D3D] mx-[2.5rem]'></div>

        <div className='flex items-center justify-between text-[#808080] flex-1'>
            <div className='flex flex-col   text-left'>
                <div className='text-[#808080] text-xl font-semibold'>
                    总资产
                </div>
                <div className='mt-[1.25rem] text-left text-[#dbdbdb] text-3xl font-semibold'>
                    $457,256.32
                </div>
            </div>
            {
                infoData.map((item, index) => {
                    return <div key={`${index}_itemi`} className='flex overflow-hidden flex-col justify-center text-left min-w-[11.25rem] ml-[10px]'>
                        <div className=' text-xl font-semibold'>
                            {item.title}
                        </div>
                        <div className='mt-[0.625rem] text-left text-[#dbdbdb] text-[1.75rem] font-semibold'>
                            {item.num}
                        </div>
                        <div className='mt-[0.625rem]  text-base flex'>
                            <span>{item.percent} </span>
                            <span className='ml-1.5'>{item.rate}</span>
                        </div>
                    </div>
                })
            }

            <div className='flex flex-col justify-center align-center '>
                <div className='w-[7.5rem] font-sm cursor-pointer py-2.5 text-center border-[1px] border-solid box-border border-[#3D3D3D] rounded-[6px] hover:text-[#2962FF] hover:border-[#2962FF]'>下载报告</div>
                <div className='w-[7.5rem] font-sm cursor-pointer py-2.5 text-center border-[1px] border-solid box-border border-[#3D3D3D] rounded-[6px] mt-2.5 hover:text-[#2962FF] hover:border-[#2962FF]'>联系支持</div>
            </div>
        </div>
    </div>
}

export default AssetsInfo