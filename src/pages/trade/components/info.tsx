import photo from '@/assets/image/assets-photo.png'
import { JknIcon } from '@/components'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/utils/style'
import { useToast } from '@/hooks'
import DialogAssets from './dialog'
import { getAccountInfo, createAccount } from '@/api'
import { useEffect, useState } from 'react'
import { useAssetsInfoStore } from '@/store/chat'
import { getColor, numberFormat } from '../const'

interface InfoType {
    avatar?: string;//头像
    balance?: number;//可用余额
    id?: number;
    invest?: object;// 投资组合
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
    const { toast } = useToast();
    const query = useQuery<InfoType>({
        queryKey: [getAccountInfo.cacheKey],
        queryFn: () => getAccountInfo(),
        // refetchInterval: 30 * 1000,
    })

    useEffect(() => {
        const { data } = query
        if (data?.message) {
            // toast({ description: data.message })
            if (data?.message == "账户信息不存在") {
                setInfo({ state: -1 })
                useAssetsInfoStore?.getState()?.setData({ state: -1 })
            }
        } else if (data) {
            const reslut: InfoType = { ...data, ...(data?.invest || {}) }
            setInfo(reslut || {})
            useAssetsInfoStore?.getState()?.setData(reslut)
        }
    }, [query.data])

    const infoData = [
        {
            title: '可用金额',
            num: 'balance',
            percent: ({ balance = 0, total_asset = 0 }: InfoType) =>
                `比例 ${total_asset ? (Number(balance) / Number(total_asset) * 100).toFixed(2) : 0}%`,
            rate: ''
        },
        {
            title: '投资组合',
            num: 'market_cap',
            percent: ({ return_rate = 0 }: InfoType) => <>回报率 <span className={getColor(return_rate)}>{numberFormat(return_rate, 100)}</span> </>,
            rate: ({ profit_loss = 0 }: InfoType) => <span className={cn('ml-1.5', getColor(profit_loss))}>{`$${profit_loss}`} </span>
        },
        {
            title: '当日回报',
            num: 'profit_loss_today',
            percent: ({ return_rate_today = 0 }: InfoType) => <>回报率 <span className={getColor(return_rate_today)}>{numberFormat(return_rate_today || 0, 100)}</span></>,
            rate: ''
        },
    ]

    const handleAccount = () => {
        createAccount().then(({ status, msg }) => {
            toast({ description: status == 1 ? '开通成功' : msg })
            if (status == 1) query.refetch()
        }).catch(err => {
            toast({ description: err.message })
        })
    }

    return <div className="h-[11.25rem] box-border py-[2.5rem] px-[1.5rem] w-full flex item-center bg-[#1A191B] rounded-[2rem]">
        <>
            {
                info.state == -1 ? <div className='flex items-center justify-center flex-col'>
                    <div>账户还未开通，请先开通账号</div>
                    <div className='px-[10px] py-[12px] mt-[20px] box-border flex items-center justify-center bg-[#441ABC] rounded-[300px] w-[7.25rem] text-center font-sm cursor-pointer'
                        onClick={() => handleAccount()}>
                        <span className='ml-1'>开通账号</span>
                    </div>
                </div> :
                    <> <div className="flex item-center flex-col justify-center">
                        <img src={info.avatar || photo} alt="" className='w-[4rem] h-[4rem] object-contain' />
                        <span className='max-w-[5rem] block leading-7 whitespace-nowrap text-center text-ellipsis overflow-hidden'>{info.nickname}</span>
                    </div>
                        <div className='ml-[2.5rem]'>
                            <DialogAssets type='deposit' refreshInfo={() => query.refetch()} >
                                <div className='px-[10px] py-[12px] box-border flex items-center justify-center bg-[#441ABC] rounded-[300px] w-[7.25rem] text-center font-sm cursor-pointer'>
                                    <JknIcon.Svg name="assets-add" size={24} />
                                    <span className='ml-1'>存款</span>
                                </div>
                            </DialogAssets>
                            <DialogAssets type='retreat' refreshInfo={() => query.refetch()} >
                                <div className='px-[10px] py-[12px] box-border flex items-center justify-center bg-[#2e2e2e] rounded-[300px] w-[7.25rem] text-center font-sm cursor-pointer mt-[10px] ' >
                                    <JknIcon.Svg name="assets-retreat" size={24} />
                                    <span className='ml-1'>撤退</span>
                                </div>
                            </DialogAssets>
                        </div></>
            }
        </>

        <div className='w-[1px] bg-[#3D3D3D] mx-[2.5rem]'></div>

        <div className='flex items-center justify-between text-[#808080] flex-1'>
            <div className='flex flex-col   text-left'>
                <div className='text-[#84838F] text-xl font-semibold flex items-center'>
                    <JknIcon.Svg name="total-assets" size={22} />
                    <span className='ml-[4px]'>总资产</span>
                </div>
                <div className='mt-[1.25rem] text-left text-[#dbdbdb] text-3xl font-semibold'>
                    ${info.total_asset || 0}
                </div>
            </div>
            {
                infoData.map((item, index) => {
                    return <div key={`${index}_itemi`} className='flex overflow-hidden flex-col justify-center text-left min-w-[11.25rem] ml-[10px]'>
                        <div className=' text-xl font-base'>
                            {item.title}
                        </div>
                        <div className='mt-[0.625rem] text-left text-[#dbdbdb] text-[1.75rem]'>
                            ${info[item.num] || 0}
                        </div>
                        <div className='mt-[0.625rem]  text-base flex'>
                            <span>{typeof item.percent == 'function' ? item.percent(info) : info[item.percent]} </span>
                            {
                                typeof item.rate == 'function' ? item.rate(info) : info[item.rate]
                            }
                        </div>
                    </div>
                })
            }

            <div className='flex flex-col justify-center align-center '>
                {/* <div className='w-[7.5rem] font-sm cursor-pointer py-2.5 text-center border-[1px] border-solid box-border border-[#3D3D3D] rounded-[6px] hover:text-[#2962FF] hover:border-[#2962FF]'>下载报告</div>
                <div className='w-[7.5rem] font-sm cursor-pointer py-2.5 text-center border-[1px] border-solid box-border border-[#3D3D3D] rounded-[6px] mt-2.5 hover:text-[#2962FF] hover:border-[#2962FF]'>联系支持</div> */}
            </div>
        </div>
    </div>
}

export default AssetsInfo