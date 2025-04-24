import photo from '@/assets/image/assets-photo.png'
import { JknIcon } from '@/components'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/utils/style'
import { useBoolean } from 'ahooks'
import DialogAssets from './dialog'
import { getAccountInfo } from '@/api'
import { useEffect, useState } from 'react'
import { useAssetsInfoStore } from '@/store/chat'

interface InfoType {
    avatar?: string;//头像
    balance?: number;//可用余额
    id?: number;
    invest?: number;// 投资组合
    nickname?: string;   // 昵称
    return_rate?: number;  // 回报率
    today_invest?: number; // 当日回报
    today_profit?: number;  // 当日盈亏
    today_return_rate?: number; // 当日回报率   
    total_asset?: number; // 总资产
    total_profit?: number; // 总盈亏
    [property: string]: any;
}


const AssetsInfo = () => {
    // const [open, { setTrue, setFalse }] = useBoolean(false)
    const [info, setInfo] = useState<InfoType>({})
    const query = useQuery<InfoType>({
        queryKey: [getAccountInfo.cacheKey],
        queryFn: () => getAccountInfo(),
        // refetchInterval: 30 * 1000,
    })

    useEffect(() => {
        console.log('query.data', getAccountInfo.cacheKey)
    }, [])

    useEffect(() => {
        const { data } = query
        if (data) {
            setInfo(query.data || {})
            useAssetsInfoStore?.getState()?.setData(data)
        }
    }, [query])

    const infoData = [
        {
            title: '可用金额',
            num: 'balance',
            percent: ({ balance = 0, total_asset = 0 }: InfoType) =>
                `比例 ${total_asset ? Number(balance) / Number(total_asset) * 100 : 0}%`,
            rate: ''
        },
        {
            title: '投资组合',
            num: 'invest',
            percent: ({ return_rate }: InfoType) => `回报率 ${return_rate}%`,
            rate: ({ today_profit }: InfoType) => `$${today_profit}`
        },
        {
            title: '当日回报',
            num: 'today_invest',
            percent: ({ today_return_rate }: InfoType) => `回报率 ${today_return_rate}%`,
            rate: ''
        },
    ]

    return <div className="h-[11.25rem] border-[1px] border-solid box-border border-[#3D3D3D] rounded-[10px] py-[2.5rem] px-[1.5rem] w-full flex item-center">
        <div className="flex item-center flex-col justify-center">
            <img src={photo} alt="" className='w-[4rem] h-[4rem] object-contain' />
            <span className='max-w-[5rem] block leading-7 whitespace-nowrap text-ellipsis overflow-hidden'>{info.nickname}</span>
        </div>
        <div className='ml-[2.5rem]'>
            <DialogAssets type='deposit' refreshInfo={() => query.refetch()} >
                <div className='px-[10px] py-[12px] box-border flex items-center justify-center bg-[#2962ff] rounded-[6px] w-[7.25rem] text-center font-sm cursor-pointer'>
                    <JknIcon.Svg name="assets-add" size={24} />
                    <span className='ml-1'>存款</span>
                </div>
            </DialogAssets>
            <DialogAssets type='retreat' refreshInfo={() => query.refetch()} >
                <div className='px-[10px] py-[12px] box-border flex items-center justify-center bg-[#2e2e2e] rounded-[6px] w-[7.25rem] text-center font-sm cursor-pointer mt-[10px] ' >
                    <JknIcon.Svg name="assets-retreat" size={24} />
                    <span className='ml-1'>撤退</span>
                </div>
            </DialogAssets>
        </div>
        <div className='border-[1px] border-solid box-border border-[#3D3D3D] mx-[2.5rem]'></div>

        <div className='flex items-center justify-between text-[#808080] flex-1'>
            <div className='flex flex-col   text-left'>
                <div className='text-[#808080] text-xl font-semibold'>
                    总资产
                </div>
                <div className='mt-[1.25rem] text-left text-[#dbdbdb] text-3xl font-semibold'>
                    ${info.total_asset || 0}
                </div>
            </div>
            {
                infoData.map((item, index) => {
                    return <div key={`${index}_itemi`} className='flex overflow-hidden flex-col justify-center text-left min-w-[11.25rem] ml-[10px]'>
                        <div className=' text-xl font-semibold'>
                            {item.title}
                        </div>
                        <div className='mt-[0.625rem] text-left text-[#dbdbdb] text-[1.75rem] font-semibold'>
                            ${info[item.num] || 0}
                        </div>
                        <div className='mt-[0.625rem]  text-base flex'>
                            <span>{typeof item.percent == 'function' ? item.percent(info) : info[item.percent]} </span>
                            <span className='ml-1.5'>{typeof item.rate == 'function' ? item.rate(info) : info[item.rate]} </span>
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