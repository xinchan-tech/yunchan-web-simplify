import React, { useState, useEffect, MouseEventHandler, FC, ReactNode, memo, PropsWithChildren, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Input,
  JknAlert,
  JknIcon,
  JknRcTable,
  JknRcTableProps,
  Dialog,
  DialogContent,
  DialogClose,
  DialogTrigger,
  useModal,
} from "@/components";
import { useToast } from "@/hooks";
import {
  getStockCollectCates,
  removeStockCollectCate,
  updateStockCollectCate,
  addStockCollectCate,
} from "@/api";
import { useQuery } from "@tanstack/react-query";
import to from "await-to-js";
import dayjs from "dayjs";
import { useAuthorized } from "@/hooks";

/**
 * 金池管理器组件
 *
 * @returns 金池管理器组件
 */
export const GoldenPoolManager = memo(() => {
  const { modal, context } = useModal({
    content: <GoldenPoolTable />,
    title: "编辑",
    footer: null,
    closeIcon: true,
    className: "w-[608px]",
    onOpen: () => {},
  });

  return (
    <>
      <div
        className="cursor-pointer text-sm pr-2 flex items-center"
        onClick={() => modal.open()}
        onKeyDown={() => {}}
      >
        <JknIcon.Svg name={"more"} size={24} className="mr-1" color="#808080" />
      </div>
      {context}
    </>
  );
});

/**
 * 金池表格组件
 *
 * @returns 金池表格组件
 */
const GoldenPoolTable = () => {
  const cates = useQuery({
    queryKey: [getStockCollectCates.cacheKey],
    queryFn: () => getStockCollectCates(),
  });

  const columns: JknRcTableProps["columns"] = [
    { title: "名称", dataIndex: "name", align: "left", width: '35%'},
    { title: "股票数量", dataIndex: "total", align: "left", width: '20%' },
    {
      title: "创建时间",
      dataIndex: "create_time",
      align: "left",
      width: '30%',
      render: (v) => (v !== "0" ? dayjs(+v * 1000).format("YYYY-MM-DD") : "-"),
    },
    {
      title: "操作",
      dataIndex: "opt",
      align: "right",
      render: (_, row) =>
        row.id !== "1" ? (
          <div className="flex items-center justify-end">
            <GoldenPoolNameEdit id={row.id as string} onUpdate={cates.refetch}>
              <JknIcon.Svg name="edit" size={20} className="ml-1 cursor-pointer" color="#808080" />
            </GoldenPoolNameEdit>
            <span
              className="cursor-pointer ml-3"
              onClick={() => onDelete(row.id as string, row.name as string)}
              onKeyDown={() => {}}
            >
              <JknIcon.Svg name="delete" size={20} className="ml-1 cursor-pointer" color="#808080" />
            </span>
          </div>
        ) : null,
    },
  ];

  const { toast } = useToast();

  /**
   * 删除金池
   *
   * @param id - 金池ID
   * @param name - 金池名称
   */
  const onDelete = async (id: string, name: string) => {
    JknAlert.confirm({
      cancelBtn: true,
      content: (
        <div className="mt-4 text-[#DBDBDB] text-left text-base">
          确定删除该金池？删除后将取消该金池里已收藏的股票，此操作不可撤销
        </div>
      ),
      onAction: async (action) => {
        if (action === "confirm") {
          const [err] = await to(removeStockCollectCate(id));

          if (err) {
            toast({ description: err.message });
            return false;
          }

          cates.refetch();
        }
      },
    });
  };

  return (
    <div className="w-full overflow-hidden">
      <div className="h-[391px] w-full overflow-hidden pool-manager">
        <JknRcTable
          className="px-8"
          columns={columns}
          data={cates.data}
          isLoading={cates.isLoading}
        />
      </div>
      <div className="flex justify-end text-center mr-8 mb-5">
        <GoldenPoolNameEdit onUpdate={cates.refetch}>
          <Button variant="default" className="py-2 px-8">
            <span>新建</span>
          </Button>
        </GoldenPoolNameEdit>
      </div>

      <style jsx global>{`
        .pool-manager .rc-table th {
          padding-top: 20px;
          padding-bottom: 20px;
          border: none;
        }
        .pool-manager .rc-table td {
          border: none;
          height: 50px;
          padding-top: 0;
          padding-bottom: 0;
        }
        .pool-manager .rc-table-cell {
          color: #808080;
        }
      `}
      </style>
    </div>
  );
};

/**
 * 金池名称编辑组件
 * 用于新建或重命名金池
 * @param props 组件属性
 * @returns 组件
 */
export const GoldenPoolNameEdit: FC<{
  id?: string;
  name?: string;
  onUpdate: () => void;
  children: ReactNode;
  sideOffset?: number;
  alignOffset?: number;
}> = (props) => {
  const [name, setName] = useState(props.name || "");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [auth, toastNotAuth] = useAuthorized('stockPoolNum');
  
  // 获取金池列表
  const collects = useQuery({
    queryKey: [getStockCollectCates.cacheKey],
    queryFn: () => getStockCollectCates(),
  });

  // 当编辑现有金池时，设置默认名称
  useEffect(() => {
    if (props.id && collects.data) {
      // 查找对应ID的金池
      const currentPool = collects.data.find((pool: { id: string; name: string }) => 
        pool.id === props.id
      );
      
      // 如果找到了，设置名称
      if (currentPool) {
        setName(currentPool.name);
      }
    }
  }, [props.id, collects.data]);

  /**
   * 处理确认操作
   * 新建或更新金池
   */
  const onAction = async () => {
    if (!name) {
      toast({
        title: "请输入金池名称",
        variant: "destructive",
      });
      return;
    }

    const [err] = await to(
      props.id
        ? updateStockCollectCate({
            id: props.id,
            name,
          })
        : addStockCollectCate(name)
    );

    if (err) {
      toast({
        title: err.message || "操作失败",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: props.id ? "重命名成功" : "新建成功",
    });

    // 关闭对话框
    setOpen(false);
    
    // 调用更新回调
    props.onUpdate();
  };

  /**
   * 处理点击事件
   * 在新建金池时检查权限
   */
  const handleClick: MouseEventHandler<HTMLDivElement> = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!props.id) {
      const max = auth();
      if (!max || max <= (collects.data?.length ?? 0)) {
        toastNotAuth();
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }
    
    // 打开对话框
    setOpen(true);
    
    // 阻止事件冒泡，防止触发父组件的点击事件
    e.stopPropagation();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button reset className="inline">
          <div onClick={handleClick} onKeyDown={() => {}}>
            {props.children}
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="w-[300px] text-center rounded-2xl bg-[#1F1F1F] border-[#2E2E2E]"
      >
        <div className="text-center py-5">{props.id ? "重命名" : "新建金池"}</div>
        <div className="mt-5 px-4">
          <Input
            className="pb-2 border-x-0 border-t-0 border-b border-[#2E2E2E] rounded-none placeholder:text-[#575757]"
            size="sm"
            placeholder="请输入金池名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex justify-between mt-[10px] mb-5">
            <DialogClose asChild>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-[120px] h-9 border-[#DBDBDB]"
              >
                取消
              </Button>
            </DialogClose>
            <Button 
              size="sm" 
              className="w-[120px] h-9" 
              onClick={onAction}
            >
              确定
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};