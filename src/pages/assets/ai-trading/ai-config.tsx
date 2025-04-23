import StockSelect from './stock-select';
import { type StockTrading, stockUtils } from '@/utils/stock';
import { Input } from '@/components';
import { cn } from '@/utils/style';
import { useEffect, useState } from 'react';
import { z } from 'zod'
import { Button, JknIcon } from '@/components';
import { useZForm, useToast } from '@/hooks'
import { saveTrades, TradesParamsType } from '@/api'
import { useToast } from '@/hooks'
import BigNumber from 'bignumber.js';
import { FormProvider, useFormContext } from 'react-hook-form'
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
        .number({ required_error: '请输入金额' })
        .min(0.01, { message: '金额必须大于0' })
        .refine((value) => /^\d+(\.\d{1,2})?$/.test(value.toString()), {
            message: '金额最多只能保留两位小数',
        })
        .refine((value) => value.toString().replace('.', '').length <= 9, {
            message: '金额不能超过九位数', // 校验金额不能超过九位数
        }),
    quantity: z
        .number({ required_error: '请输入金额' })
        .min(0.01, { message: '金额必须大于0' })
        .refine((value) => /^\d+(\.\d{1,2})?$/.test(value.toString()), {
            message: '金额最多只能保留两位小数',
        })
        .refine((value) => value.toString().replace('.', '').length <= 9, {
            message: '金额不能超过九位数', // 校验金额不能超过九位数
        }),

});

// const totalPrices = useCallback((price: number, price: number) => {
//     return (price * price).toFixed(2);
// }, []);

const AiConfig = ({ list, row }: { list: TableDataType[]; row: TableDataType }) => {
    const [type, setType] = useState(1);
    const [selectedAction, setSelectedAction] = useState<SelectedActionType>('buy'); // 选中状态
    const [stock, setStock] = useState<TableDataType | null>(null);
    const { toast } = useToast();

    const form = useZForm(formSchema, {
        price: '',
        quantity: '',
    });

    const { watch, setValue } = form;
    const price = watch('price'); // 监听价格
    const quantity = watch('quantity'); // 监听数量
    const totalAmount = new BigNumber(price || 0).multipliedBy(new BigNumber(quantity || 0)).toFixed(2);

    const tabs = [
        { key: 1, label: `常规类型` },
        { key: 2, label: `AI浮动追踪` },
    ];

    const onTypeChange = (key: string) => {
        setType(key);
    };

    useEffect(() => {
        if (row.price) {
            form.setValue('price', row.price)
        }
        setStock(row)
    }, [row])

    const onsubmit = async (key: SelectedActionType) => {
        const valid = await form.trigger();
        console.log('valid', valid, stock)
        const params: TradesParamsType = getSaveParams(key)
        saveTrades(params).then(({ status }) => {
            if (status == 1) {
                toast({ description: '保存成功' })
            }
        })
    }

    function getSaveParams(key: SelectedActionType) {
        const data = form.getValues()
        const param = {
            symbol: stock?.symbol,
            type,
            direction: key == 'buy' ? 1 : 2,
            condition: {}
        }
        if (type == 1) {
            const { price, quantity } = data
            param.condition = {
                params: [{ price, quantity }]
            }
        } else { }

        return param
    }

    const onSelectChange = (row: TableDataType) => {
        form.setValue('price', row.price)
        setStock(row)
    }

    return (
        <div className="border-[1px] border-solid border-[#3c3c3c] rounded-md p-6 flex-1">
            <div className="text-2xl font-bold">AI交易配置</div>
            <FormProvider {...form}>
                <div className="w-[32rem] mt-5">
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
                        <StockSelect list={list} row={row} classNmae="pr-[12px]" onChange={row => onSelectChange(row)} />
                    </div>

                    {/* 价格、数量、金额 */}
                    <div className="box-border flex justify-between border-[1px] border-solid border-[#3c3c3c] px-2.5 py-1 rounded-md mt-2.5">
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
                                        <FormMessage className="text-sm text-destructive absolute right-2 left-[8.5rem] bottom-[-15px]" />
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
                                            <FormMessage className="text-sm text-destructive absolute right-2 left-[8.5rem] bottom-[-15px]" />
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
                            <div className="text-[#808080] text-sm">{totalAmount}</div>
                        </div>
                    </div>

                    {/* 类型选择 */}
                    <div className="w-full box-border mt-2.5">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="flex w-full justify-between px-2.5 py-2.5 box-border border-[1px] w-[10rem] border-solid border-[#3c3c3c] rounded-md items-center space-x-2 text-lg font-bold">
                                    <div className="text-sm text-[#808080]">类型</div>
                                    <div>
                                        <span className="text-[#DBDBDB] text-sm pr-5 box-border">
                                            {tabs.find((tab) => tab.key == type)?.label}
                                        </span>
                                        <JknIcon.Svg name="arrow-down" size={10} />
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

                    {/* 提交按钮 */}
                    <div className="mt-5">
                        {selectedAction === 'buy' && (
                            <Button className="py-2 text-content w-full bg-[#089981] text-base text-bold text-[#fff]" onClick={() => onsubmit('buy')}>
                                买入
                            </Button>
                        )}
                        {selectedAction === 'sell' && (
                            <Button className="py-2 text-content w-full bg-[#F23645] text-base text-bold text-[#fff]" onClick={() => onsubmit('sell')}>
                                卖出
                            </Button>
                        )}
                    </div>
                </div>
            </FormProvider>
        </div>
    );
};

export default AiConfig;