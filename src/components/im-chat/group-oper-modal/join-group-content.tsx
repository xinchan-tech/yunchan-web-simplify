import { useEffect, useState } from "react";

import { Input } from "../../ui/input";
import { cn } from "@/utils/style";
import { useUser } from "@/store";
import { useQuery } from "@tanstack/react-query";
import { getGroupChannels } from "@/api";
import type { GroupChannelItem } from "@/api";
import GroupChannelCard from "../group-channel-card";

type GroupCategoryValue = "1" | "2" | "3";

type GroupCategory = {
  label: string;
  value: GroupCategoryValue;
};

const JoinGroupContent: React.FC = () => {
  const { user } = useUser();
  const [currentCategory, setCurrentCategory] =
    useState<GroupCategoryValue>("1");
  const [keywords, setKeywords] = useState("");
  const category: GroupCategory[] = [
    {
      label: "热门",
      value: "1",
    },
    {
      label: "推荐",
      value: "2",
    },
    {
      label: "高端",
      value: "3",
    },
    // {
    //   label: "价格",
    //   value: "price",
    // },
  ];

  const option = {
    queryKey: [getGroupChannels.cacheKey, currentCategory, keywords],
    queryFn: () =>
      getGroupChannels({
        type: currentCategory,
        keywords,
      }),
  };

  const { data } = useQuery(option);

  useEffect(() => {
    console.log(user);
  }, []);

  return (
    <>
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
          {category.map((item: GroupCategory) => (
            <div
              onClick={() => {
                setCurrentCategory(item.value);
              }}
              className={cn(
                "mr-4 tag-cont-item",
                item.value === currentCategory && "tag-active"
              )}
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>
      <div className="bottom-area">
        {(data?.items || []).map((channel: GroupChannelItem) => {
          return <GroupChannelCard data={channel}></GroupChannelCard>;
        })}
      </div>
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
          padding-right: 80px;
          padding-left: 80px;
        }
      `}</style>
    </>
  );
};

export default JoinGroupContent;
