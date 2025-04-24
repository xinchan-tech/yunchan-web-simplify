import React, { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
} from '@/components';
import { Button } from '@/components';

type PlacementType =
    | 'top'
    | 'topLeft'
    | 'topRight'
    | 'bottom'
    | 'bottomLeft'
    | 'bottomRight'
    | 'left'
    | 'right';

type JknPopconfirmProps = {
    title: string; // 确认框的标题
    onConfirm: () => void; // 确认操作的回调
    onCancel?: () => void; // 取消操作的回调（可选）
    placement?: PlacementType; // 弹窗位置
    children: React.ReactNode; // 触发 Popconfirm 的子组件
};

const JknPopconfirm: React.FC<JknPopconfirmProps> = ({
    title,
    onConfirm,
    onCancel,
    placement = 'top', // 默认位置为顶部
    children,
}) => {
    const [open, setOpen] = useState(false); // 控制弹窗的打开状态

    const handleCancel = () => {
        if (onCancel) onCancel(); // 执行取消回调
        setOpen(false); // 关闭弹窗
    };

    const handleConfirm = () => {
        onConfirm(); // 执行确认回调
        setOpen(false); // 关闭弹窗
    };

    // 动态设置弹窗位置的类名
    const getPlacementClass = () => {
        switch (placement) {
            case 'top':
                return 'translate-x-[-50%] bottom-full mb-2';
            case 'topLeft':
                return 'bottom-full mb-2 left-0';
            case 'topRight':
                return 'bottom-full mb-2 right-0';
            case 'bottom':
                return 'translate-x-[-50%] top-full mt-2';
            case 'bottomLeft':
                return 'top-full mt-2 left-0';
            case 'bottomRight':
                return 'top-full mt-2 right-0';
            case 'left':
                return 'right-full mr-2 top-1/2 translate-y-[-50%]';
            case 'right':
                return 'left-full ml-2 top-1/2 translate-y-[-50%]';
            default:
                return '';
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                {children}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className={`absolute z-50 p-4 bg-[#3c3c3c] border border-[#fff] rounded-md ${getPlacementClass()}`}
            >
                <div className="text-white text-sm mb-4">{title}</div>
                <div className="flex justify-end space-x-4">
                    <Button variant="outline" className="w-20" onClick={handleCancel}>
                        取消
                    </Button>
                    <Button className="w-20" onClick={handleConfirm}>
                        确定
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default JknPopconfirm;