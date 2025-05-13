import StockSelect from './stock-select';
import { type StockTrading, stockUtils } from '@/utils/stock';
import { Input } from '@/components';
import { cn } from '@/utils/style';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod'
import { Button, JknIcon, JknDatePicker } from '@/components';
import { useZForm, useToast } from '@/hooks'
import { saveTrades, TradesParamsType, getStockBaseCodeInfo } from '@/api'
import { useToast } from '@/hooks'
import BigNumber from 'bignumber.js';
import { FormProvider, useFormContext } from 'react-hook-form'
import { useAssetsInfoStore } from '@/store/chat'
import Decimal from 'decimal.js'
import { useBoolean } from 'ahooks'
import { useQuery } from '@tanstack/react-query'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components';

type TableDataType = ReturnType<typeof stockUtils.toStockWithExt>;
type SelectedActionType = 'buy' | 'sell';

const formSchema = z.object({
    price: z
        .number({ invalid_type_error: '请输入价格' })
        .min(0.01, { message: '价格必须大于0' })
        .refine((value) => /^\d+(\.\d{1,3})?$/.test(value.toString()), {
            message: '价格最多只能保留三位小数',
        })
        .refine((value) => value.toString().replace('.', '').length <= 9, {
            message: '价格不能超过九位数', // 校验金额不能超过九位数
        }),
    aiPrice: z
        .number({ invalid_type_error: '请输入' })
        .min(0.01, { message: '金额必须大于0' })
        .refine((value) => /^\d+(\.\d{1,3})?$/.test(value.toString()), {
            message: '金额最多只能保留三位小数',
        })
        .refine((value) => value.toString().replace('.', '').length <= 9, {
            message: '金额不能超过九位数', // 校验金额不能超过九位数
        }),
    retailPrice: z
        .number({ invalid_type_error: '请输入目标价' })
        .min(0.01, { message: '目标价必须大于0' })
        .refine((value) => /^\d+(\.\d{1,3})?$/.test(value.toString()), {
            message: '目标价最多只能保留三位小数',
        })
        .refine((value) => value.toString().replace('.', '').length <= 9, {
            message: '目标价不能超过九位数', // 校验金额不能超过九位数
        }),
    quantity: z
        .number({ invalid_type_error: '请输入数量' })
        .min(0.01, { message: '数量必须大于0' })
        .int({ message: '数量必须是整数' })
        .refine((value) => value.toString().replace('.', '').length <= 9, {
            message: '数量不能超过九位数', // 校验金额不能超过九位数
        }),
    aiQuantity: z
        .number({ invalid_type_error: '请输入数量' })
        .min(0.01, { message: '数量必须大于0' })
        .int({ message: '数量必须是整数' })
        .refine((value) => value.toString().replace('.', '').length <= 9, {
            message: '数量不能超过九位数', // 校验金额不能超过九位数
        }),
    retailQuantity: z
        .number({ invalid_type_error: '请输入数量' })
        .min(0.01, { message: '数量必须大于0' })
        .int({ message: '数量必须是整数' })
        .refine((value) => value.toString().replace('.', '').length <= 9, {
            message: '数量不能超过九位数', // 校验金额不能超过九位数
        }),

});

type AiTypes = 'percent' | 'price'

const AiConfig = ({ row }: { list: TableDataType[]; row: TableDataType }) => {
    const [type, setType] = useState(1);
    const [selectedAction, setSelectedAction] = useState<SelectedActionType>('buy'); // 选中状态
    const [aiType, setAiType] = useState<AiTypes>("percent")
    const [stock, setStock] = useState<string>('');
    const [createTime, setCreateTime] = useState<string>("")
    const [loading, { setTrue: setLoadingTrue, setFalse: setLoadingFalse }] = useBoolean(false);
    const [hovered, setHovered] = useState(false); // 控制图标切换
    const { toast } = useToast();

    let form = useZForm(formSchema, {
        price: '',
        quantity: '',
        aiPrice: "",
        aiQuantity: "",
        retailPrice: "",
        retailQuantity: "",
    });


    const { watch, setValue, trigger } = form;
    const price = watch('price'); // 监听价格
    const quantity = watch('quantity'); // 监听数量
    const aiPrice = watch('aiPrice'); // 监听价格
    const aiQuantity = watch('aiQuantity'); // 监听数量
    const retailPrice = watch('retailPrice'); // 监听数量
    const retailQuantity = watch('retailQuantity'); // 监听数量
    const totalAmount = new BigNumber(price || 0).multipliedBy(new BigNumber(quantity || 0)).toFixed(2);
    const aiTotalAmount = new BigNumber(aiPrice || 0).multipliedBy(new BigNumber(aiQuantity || 0)).toFixed(2);
    const retailTotalAmount = new BigNumber(retailPrice || 0).multipliedBy(new BigNumber(retailQuantity || 0)).toFixed(2);

    const tabs = [
        { key: 1, label: `常规类型` },
        { key: 2, label: `AI浮动追踪` },
    ];

    const query = useQuery({
        queryKey: [getStockBaseCodeInfo.cacheKey, stock, ['total_share']],
        queryFn: () => getStockBaseCodeInfo({ symbol: stock, extend: ['total_share'] }),
        enabled: !!stock,
        select: data => data
            ? stockUtils.toStock(data.stock, {
                extend: data.extend,
                symbol: data.symbol,
                name: data.name
            })
            : null
    })

    const calcPrice = (type: 'price' | 'percent') => {
        if (!(aiQuantity && aiPrice)) return ''
        let v
        let x = selectedAction == 'buy' ? -1 : 1
        if (aiType === 'percent') {
            v = Decimal.create(query.data?.close ?? 0)
                .mul(1 + x * (+aiPrice / 100))
                .toNumber()


        } else {
            v = Decimal.create(query.data?.close ?? 0)
                .plus(x * + aiPrice)
                .toNumber()
        }
        return (v * aiQuantity).toFixed(2)
    }

    const onTypeChange = (key: string) => {
        setType(key);
    };

    // useEffect(()=>{

    // }, [type])

    useEffect(() => {
        if (row?.price) {
            form.setValue('price', row.price)
        }
        if (row?.symbol) setStock(row.symbol)
    }, [row])

    useEffect(() => {
        if (price) {
            trigger('price')
        }
    }, [price])

    useEffect(() => {
        if (quantity) {
            trigger('quantity')
        }
    }, [quantity])

    useEffect(() => {
        if (aiPrice) {
            trigger('aiPrice')
        }
    }, [aiPrice])

    useEffect(() => {
        if (aiQuantity) {
            trigger('aiQuantity')
        }
    }, [aiQuantity])

    useEffect(() => {
        if (retailPrice) {
            trigger('retailPrice')
        }
    }, [retailPrice])

    useEffect(() => {
        if (retailQuantity) {
            trigger('retailQuantity')
        }
    }, [retailQuantity])

    const onsubmit = async (key: SelectedActionType) => {
        if (!stock) return toast({ description: '请先选择股票' })
        const verify = type == 1 ? ['price', 'quantity'] : ["aiPrice", "aiQuantity", "retailPrice", "retailQuantity"]
        const valid = await form.trigger(verify);
        if (!valid) return
        if (selectedAction == 'buy') { //买入比较可用金额
            const info = useAssetsInfoStore?.getState()?.data || {}
            let _totalAmount = type == 1 ? totalAmount : aiTotalAmount
            if (_totalAmount > info.balance) return toast({ description: '可用金额不足，请先存款！' })
        } else {  //卖出比较数量
            //目前还没有数量获取的地方
        }
        const params: TradesParamsType = getSaveParams(key)
        setLoadingTrue()
        saveTrades(params).then(({ status, msg }) => {
            if (status == 1) {
                toast({ description: '保存成功' })
                form.reset()
            } else {
                toast({ description: msg })
            }
        }).catch((err) => {
            toast({ description: err.message })
        }).finally(() => setLoadingFalse())
    }

    function getSaveParams(key: SelectedActionType) {
        const data = form.getValues()
        let datetime = ''
        if (createTime) {
            const date = new Date(createTime);
            const timestampInMilliseconds = date.getTime();
            datetime = Math.floor(timestampInMilliseconds / 1000);
        }
        const param = {
            symbol: stock,
            type,
            direction: key == 'buy' ? 1 : 2,
            condition: {}
        }
        if (datetime) param.datetime = datetime
        if (type == 1) {
            const { price, quantity } = data
            param.condition = {
                params: [{ price, quantity }]
            }
        } else {
            const { aiPrice, aiQuantity, retailPrice, retailQuantity } = data
            param.condition = {
                ai_params: [
                    { type: 3, change_value: retailPrice, quantity: retailQuantity },
                    { type: aiType == 'percent' ? 1 : 2, change_value: aiType == 'percent' ? aiPrice / 100 : aiPrice, quantity: aiQuantity }
                ]
            }
        }

        return param
    }

    const onClose = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCreateTime('')
    }

    return (
        <div className="bg-[#1A191B] rounded-[2rem] p-6 flex-1">
            <div className="text-2xl font-bold">AI交易配置</div>
            <FormProvider {...form}>
                <div className="w-[32rem] mt-5 ">
                    {/* 买入/卖出切换 */}
                    <div className="w-full flex rounded-md mt-2.5 relative h-10 ">
                        <div
                            className={cn(
                                'absolute top-0 left-0 w-1/2 h-full flex items-center justify-center text-white font-bold cursor-pointer transition-all',
                                selectedAction === 'buy' ? 'bg-[#089981] scale-105 z-10' : 'bg-[#065f4a] scale-95'
                            )}
                            onClick={() => setSelectedAction('buy')}
                        >
                            买入
                        </div>
                        <div
                            className={cn(
                                'absolute top-0 right-0 w-1/2 h-full flex items-center justify-center text-white font-bold cursor-pointer transition-all',
                                selectedAction === 'sell' ? 'bg-[#F23645] scale-105 z-10' : 'bg-[#a12d34] scale-95'
                            )}
                            onClick={() => setSelectedAction('sell')}
                        >
                            卖出
                        </div>
                    </div>

                    {/* 股票选择 */}
                    <div className="mt-5 w-full box-border">
                        <StockSelect value={stock} onChange={val => setStock(val)} />
                    </div>

                    {/* 类型选择 */}
                    <div className="w-full box-border mt-5">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="flex w-full justify-between px-2.5 py-2.5 box-border border-[1px] w-[10rem] border-solid border-[#3c3c3c] rounded-md items-center space-x-2 text-lg font-bold">
                                    <div className="text-sm text-[#808080]">类型</div>
                                    <div>
                                        <span className="text-[#DBDBDB] text-sm pr-5 box-border">
                                            {tabs.find((tab) => tab.key == type)?.label}
                                        </span>
                                        <JknIcon.Svg name="arrow-down" className="ml-auto text-tertiary" size={10} />
                                    </div>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent style={{ width: '32rem' }}>
                                {tabs.map((tab) => (
                                    <DropdownMenuItem key={tab.key} onClick={() => onTypeChange(tab.key as string)}>
                                        {tab.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    {
                        type == 2 ? <>
                            {/* 买卖目标价 */}
                            < div >
                                <div className="box-border flex justify-between border-[1px] border-solid border-[#3c3c3c] px-2.5 py-1 rounded-md mt-5">
                                    <div className="flex-1">
                                        <FormField
                                            control={form.control}
                                            name="retailPrice"
                                            render={({ field }) => (
                                                <FormItem className="flex items-start items-center space-y-0 relative">
                                                    <FormControl>
                                                        <div className='flex flex-col'>
                                                            <div className="text-[#808080] text-xs font-bold mb-1">{selectedAction == 'buy' ? "买入" : "卖出"}目标价</div>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                placeholder='请输入价格'
                                                                className={cn('border-none flex-1 text-center h-[20px] text-left p-0 placeholder:text-[#808080]')}
                                                                {...form.register('retailPrice', { valueAsNumber: true })}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-sx text-destructive absolute right-2 left-[0] bottom-[-24px] w-[400px]" />
                                                </FormItem>
                                            )}
                                        >
                                        </FormField>
                                    </div>
                                    <div className="flex flex-1 flex-col items-center justify-center">
                                        <div className="text-[#DBDBDB] text-sm">
                                            <FormField
                                                control={form.control}
                                                name="retailQuantity"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-start items-center space-y-0 relative">
                                                        <FormControl>
                                                            <div className='flex flex-col'>
                                                                <div className="text-[#808080] text-xs font-bold mb-1 text-center">数量</div>
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    placeholder='请输入数量'
                                                                    className={cn('border-none flex-1 text-center h-[20px] text-center p-0 placeholder:text-[#808080]')}
                                                                    {...form.register('retailQuantity', { valueAsNumber: true })}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-sx text-destructive absolute right-2 left-[0] bottom-[-24px] w-full text-center" />
                                                    </FormItem>
                                                )}
                                            >
                                            </FormField>
                                        </div>
                                    </div>
                                    <div className="flex flex-1 flex-col items-end justify-center">
                                        <div className="text-[#808080] text-xs font-bold mb-1 text-right pr-[12px] box-border">
                                            金额
                                        </div>
                                        <div className="text-[#808080] text-sm">{retailTotalAmount}</div>
                                    </div>
                                </div>
                            </div>

                            {/* 回撤配置 */}
                            <div className='mt-5'>
                                <div className='text-[#B8B8B8] text-base my-2.5'>上涨追踪</div>
                                <div className="box-border flex justify-between border-[1px] border-solid border-[#3c3c3c] px-2.5 py-1 rounded-md mt-5">
                                    <div className="flex-1">
                                        <FormField
                                            control={form.control}
                                            name="aiPrice"
                                            render={({ field }) => (
                                                <FormItem className="flex items-start items-center space-y-0 relative">
                                                    <FormControl>
                                                        <div className='flex flex-col'>
                                                            <div className="flex w-auto items-center rounded-sm text-xs px-1 py-0.5 hover:bg-accent cursor-pointer text-secondary">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <span>{aiType == 'percent' ? "按回撤比例(%)" : "按价格差额"}</span>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent>
                                                                        <DropdownMenuItem
                                                                            data-checked='percent'
                                                                            onClick={() => setAiType('percent')}
                                                                        >
                                                                            <span>按回撤比例</span>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem data-checked='price' onClick={() => setAiType('price')}>
                                                                            <span>按价格差额</span>
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                                <JknIcon.Svg name="arrow-down" className="size-3" />
                                                            </div>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                placeholder={`请输入${aiType == 'percent' ? '回撤比例' : '价格差额'}`}
                                                                className={cn('border-none flex-1 text-center h-[20px] text-left p-0 placeholder:text-[#808080]')}
                                                                {...form.register('aiPrice', { valueAsNumber: true })}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-sx text-destructive absolute right-2 left-[0] bottom-[-24px] w-[400px]" />
                                                </FormItem>
                                            )}
                                        >
                                        </FormField>
                                    </div>
                                    <div className="flex flex-1 flex-col items-center justify-center">
                                        <div className="text-[#DBDBDB] text-sm">
                                            <FormField
                                                control={form.control}
                                                name="aiQuantity"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-start items-center space-y-0 relative">
                                                        <FormControl>
                                                            <div className='flex flex-col'>
                                                                <div className="text-[#808080] text-xs font-bold mb-1 text-center">数量</div>
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    placeholder='请输入数量'
                                                                    className={cn('border-none flex-1 text-center h-[20px] text-center p-0 placeholder:text-[#808080]')}
                                                                    {...form.register('aiQuantity', { valueAsNumber: true })}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-sx text-destructive absolute right-2 left-[0] bottom-[-24px] w-full text-center" />
                                                    </FormItem>
                                                )}
                                            >
                                            </FormField>
                                        </div>
                                    </div>
                                    <div className="flex flex-1 flex-col items-end justify-center">
                                        <div className="text-[#808080] text-xs font-bold mb-1 text-right pr-[12px] box-border">
                                            金额
                                        </div>
                                        <div className="text-[#808080] text-sm">{calcPrice()}</div>
                                    </div>
                                </div>
                            </div>
                        </> : <>
                            {/* 价格、数量、金额 */}
                            <div className="box-border flex justify-between border-[1px] border-solid border-[#3c3c3c] px-2.5 py-1 rounded-md mt-5">
                                <div className="flex-1">
                                    <FormField
                                        control={form.control}
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem className="flex items-start items-center space-y-0 relative">
                                                <FormControl>
                                                    <div className='flex flex-col'>
                                                        <div className="text-[#808080] text-xs font-bold mb-1">价格</div>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            placeholder='请输入价格'
                                                            className={cn('border-none flex-1 text-center h-[20px] text-left p-0 placeholder:text-[#808080]')}
                                                            {...form.register('price', { valueAsNumber: true })}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-sx text-destructive absolute right-2 left-[0] bottom-[-24px] w-[400px]" />
                                            </FormItem>
                                        )}
                                    >
                                    </FormField>
                                </div>
                                <div className="flex flex-1 flex-col items-center justify-center">
                                    <div className="text-[#DBDBDB] text-sm">
                                        <FormField
                                            control={form.control}
                                            name="quantity"
                                            render={({ field }) => (
                                                <FormItem className="flex items-start items-center space-y-0 relative">
                                                    <FormControl>
                                                        <div className='flex flex-col'>
                                                            <div className="text-[#808080] text-xs font-bold mb-1 text-center">数量</div>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                placeholder='请输入数量'
                                                                className={cn('border-none flex-1 text-center h-[20px] text-center p-0 placeholder:text-[#808080]')}
                                                                {...form.register('quantity', { valueAsNumber: true })}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-sx text-destructive absolute right-2 left-[0] bottom-[-24px] w-full text-center" />
                                                </FormItem>
                                            )}
                                        >
                                        </FormField>
                                    </div>
                                </div>
                                <div className="flex flex-1 flex-col items-end justify-center">
                                    <div className="text-[#808080] text-xs font-bold mb-1 text-right box-border">
                                        金额
                                    </div>
                                    <div className="text-[#808080] text-sm">{totalAmount}</div>
                                </div>
                            </div>
                        </>
                    }

                    < div >
                        <div className="box-border flex justify-between border-[1px] border-solid border-[#3c3c3c] px-2.5 py-1 rounded-md mt-5">
                            <div className="flex-1">
                                <JknDatePicker onChange={v => setCreateTime(v)} >
                                    {v => (
                                        <div className="rounded-xs py-2 text-base cursor-pointer flex items-center justify-between text-tertiary">
                                            {v ?? '选择日期'}&nbsp;
                                            <span onMouseEnter={() => setHovered(true)}
                                                onMouseLeave={() => setHovered(false)} >
                                                {
                                                    hovered && createTime ? <JknIcon.Svg name="close" className="" size={10} /> :
                                                        <span onClick={(e) => onClose(e)}><JknIcon.Svg name="arrow-down" className="" size={10} /></span>
                                                }
                                            </span>

                                        </div>
                                    )}
                                </JknDatePicker>
                            </div>
                        </div>
                    </div>


                    {/* 提交按钮 */}
                    <div className="mt-10">
                        {selectedAction === 'buy' && (
                            <Button loading={loading} className="py-2 text-content w-full bg-[#089981] text-base text-bold text-[#fff]" onClick={() => onsubmit('buy')}>
                                买入
                            </Button>
                        )}
                        {selectedAction === 'sell' && (
                            <Button loading={loading} className="py-2 text-content w-full bg-[#F23645] text-base text-bold text-[#fff]" onClick={() => onsubmit('sell')}>
                                卖出
                            </Button>
                        )}
                    </div>
                </div>
            </FormProvider >
        </div >
    );
};

export default AiConfig;