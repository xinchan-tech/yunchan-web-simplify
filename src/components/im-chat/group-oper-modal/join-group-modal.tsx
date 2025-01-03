import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { cn } from "@/utils/style";

interface JoinGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type GroupCategoryValue = "hot" | "recommend" | "high-end" | "price";

type GroupCategory = {
  label: string;
  value: GroupCategoryValue;
};

const JoinGroupModal: React.FC<JoinGroupModalProps> = (
  props: JoinGroupModalProps
) => {
  const [currentCategory, setCurrentCategory] =
    useState<GroupCategoryValue>("hot");
  const category: GroupCategory[] = [
    {
      label: "热门",
      value: "hot",
    },
    {
      label: "推荐",
      value: "recommend",
    },
    {
      label: "高端",
      value: "high-end",
    },
    {
      label: "价格",
      value: "price",
    },
  ];

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="w-[800px] rounded-2xl border border-solid ">
        <DialogHeader>
          <DialogTitle asChild>
            <div className="h-[36px] text-center title">加入社群</div>
          </DialogTitle>
        </DialogHeader>
        <div className="top-area">
          <div className="flex justify-center">
            <div className=" border-dialog-border rounded-sm  bg-accent top-area-search  w-[600px]">
              <Input
                className="border-none placeholder:text-tertiary"
                placeholder="请输入内容"
                size={"sm"}
              />
            </div>
          </div>
          <div className="flex tag-conts">
            {category.map((item:GroupCategory) => (
              <div
                onClick={() => {
                  setCurrentCategory(item.value);
                }}
                className={cn(
                  "mr-4 tag-cont-item",
                  item.value === currentCategory && 'tag-active'
                )}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
        <div className='bottom-area'>
            
        </div>
      </DialogContent>
      <style jsx>{`
        .title {
          line-height: 36px;
        }
        .top-area {
          height: 120px;
          background-color: rgb(20, 21, 25);
          border-bottom: 1px solid hsl(var(--border));
        }
        .top-area-search {
          margin-top: 30px;
          margin-bottom: 30px;
        }
        .tag-conts {
          padding-left: 80px;
        }
        .tag-cont-item {
          height: 22px;
          border-radius: 11px;
          line-height: 22px;
          width: 60px;
          text-align: center;
          
        }
          .tag-active {
            background-color: hsl(var(--primary));
          }
        .bottom-area {
            padding-top: 12px;
            padding-bottom: 20px;
            height: 420px;
            overflow-y: auto;
        }
      `}</style>
    </Dialog>
  );
};

export default JoinGroupModal;
