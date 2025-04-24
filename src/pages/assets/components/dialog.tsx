import { forwardRef, useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button, JknIcon } from '@/components'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { z } from 'zod'
import { FormProvider, useFormContext } from 'react-hook-form'
import { useBoolean } from 'ahooks'
import { useZForm, useToast } from '@/hooks'
import { cn } from '@/utils/style'
import { saveAccountAddDeposit, saveAccountWithdraw } from '@/api'
import { setAccountAddDeposit } from '@/api'
import { useAssetsInfoStore } from '@/store/chat'
import { type ReactNode, useState } from 'react'

const formSchema = z.object({
    amount: z
        .number({ required_error: '请输入金额' })
        .min(0.01, { message: '金额必须大于0' })
        .refine((value) => /^\d+(\.\d{1,2})?$/.test(value.toString()), {
            message: '金额最多只能保留两位小数',
        })
        .refine((value) => value.toString().replace('.', '').length <= 9, {
            message: '金额不能超过九位数', // 校验金额不能超过九位数
        }),
});

interface DialogAssetsProps {
    children: ReactNode
    type: string,
    refreshInfo?: () => void
}


const DialogAssets: React.FC<DialogAssetsProps> = ({ children, refreshInfo, type, ...props }) => {
    const [open, { setTrue, setFalse }] = useBoolean(false);
    const [label, setLabel] = useState('存款');
    const [loading, { setTrue: setLoadingTrue, setFalse: setLoadingFalse }] = useBoolean(false);
    const { toast } = useToast();

    const form = useZForm(formSchema, {
        amount: '',
    });

    useEffect(() => {
        const name = type === 'deposit' ? '存款' : '撤退';
        setLabel(name);
    }, [type]);

    const onSubmit = async () => {
        const valid = await form.trigger();
        if (!valid) return toast({ description: '金额格式不正确' });
        const { id } = useAssetsInfoStore.getState().data;
        const data = form.getValues();
        const serve = type === 'deposit' ? saveAccountAddDeposit : saveAccountWithdraw;
        setLoadingTrue();
        serve({ ...data, account_id: id }).then(({ status, msg }) => {
            if (status == 1) {
                refreshInfo && refreshInfo()
                toast({ description: '操作成功' });
                onClose()
            } else {
                toast({ description: msg });
            }
        }).finally(() => setLoadingFalse());
    };


    function onClose() {
        form.reset()
        setFalse();
        setLoadingFalse()
    };

    return (
        <Dialog open={open} onOpenChange={(show) => (show ? setTrue() : setFalse())} modal={true}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="w-[600px] overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle asChild>
                        <div className="px-4 flex items-center">
                            <div className="text-xl">{label}</div>
                            <span
                                className={cn(
                                    'box-border rounded cursor-pointer flex items-center justify-center ml-auto w-5 h-5 hover:bg-accent'
                                )}
                                onClick={setFalse}
                                onKeyDown={() => { }}
                            >
                                <JknIcon.Svg name="close" className="w-3 h-3" />
                            </span>
                        </div>
                    </DialogTitle>
                    <DialogDescription className="text-center" />
                </DialogHeader>
                <div className="p-4">
                    <FormProvider {...form}>
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem className="pb-3 flex items-start items-center space-y-0 relative">
                                    <FormLabel className="w-32 flex-shrink-0 text-base font-normal text-right">
                                        {label}金额：
                                    </FormLabel>
                                    <FormControl>
                                        <div className="flex flex-col relative w-full pr-[60px] box-border">
                                            <div className="flex items-center border-b-primary px-4 border-[1px] border-solid border-[#3c3c3c] rounded-md bg-[#2e2e2e]">
                                                <input
                                                    type="number"
                                                    className="flex-1 bg-[#2e2e2e] border-0 w-full color-[#fff] h-8 outline-none placeholder:text-tertiary text-secondary"
                                                    placeholder="请输入存款金额"
                                                    {...form.register('amount', { valueAsNumber: true })}
                                                />
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-sm text-destructive absolute right-2 left-[8.5rem] bottom-[-15px]" />
                                </FormItem>
                            )}
                        ></FormField>
                    </FormProvider>
                    <div className="text-right space-x-2 flex justify-center px-8 my-6 mt-8 ">
                        <Button className="w-24" variant="outline" onClick={onClose}>
                            取消
                        </Button>
                        <Button className="w-24 ml-5" onClick={onSubmit} loading={loading}>
                            确定
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DialogAssets;
