import { useEffect, useState } from "react";

import { Input } from "@/components";
import { cn } from "@/utils/style";
import { useGroupChatShortStore } from "@/store/group-chat-new";
import { useQuery } from "@tanstack/react-query";
import { getGroupChannels } from "@/api";
import type { GroupChannelItem } from "@/api";
import GroupChannelCard from "./group-channel-card";
import JoinGroup from "../join-group";
import { GroupData } from "../../group-channel";
import FullScreenLoading from "@/components/loading";

type GroupCategoryValue = "1" | "2" | "3";

type GroupCategory = {
  label: string;
  value: GroupCategoryValue;
};

const JoinGroupContent = (props: { onSuccess: () => void }) => {
  const [currentCategory, setCurrentCategory] =
    useState<GroupCategoryValue>("1");
  const [keywords, setKeywords] = useState("");
  const { getGroupDetailData, groupDetailFetching, conversationWraps } =
    useGroupChatShortStore();
  const [curGroupData, setCurGroupData] = useState<GroupData | null>(null);
  const category: GroupCategory[] = [
    {
      label: "热门",
      value: "2",
    },
    {
      label: "推荐",
      value: "1",
    },
    {
      label: "高端",
      value: "3",
    },
  ];

  const option = {
    queryKey: [getGroupChannels.cacheKey, currentCategory, keywords],
    queryFn: () =>
      getGroupChannels({
        type: currentCategory,
        keywords,
      }),
  };
  const [openJoinMask, setOpenJoinMask] = useState(false);

  const { data } = useQuery(option);

  const judgeIsJoined = (account: string) => {
    let res = false;
    if (conversationWraps instanceof Array && conversationWraps.length > 0) {
      res = conversationWraps.some(
        (wrap) => wrap.channel.channelID === account
      );
    }
    return res;
  };

  return (
    <div className="w-full h-full content-box">
      {openJoinMask === true && curGroupData && (
        <div className="mask">
          <JoinGroup
            data={curGroupData}
            onSuccess={props.onSuccess}
            onClose={() => {
              setOpenJoinMask(false);
            }}
          />
        </div>
      )}
      {groupDetailFetching === true && <FullScreenLoading fullScreen={false} />}
      <div className="top-area">
        <div className="flex justify-center">
          <div className=" border-dialog-border rounded-sm  bg-accent top-area-search  w-[600px]">
            <Input
              className="border-none placeholder:text-tertiary"
              placeholder="请输入内容"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setKeywords(e.currentTarget.value);
                }
              }}
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
              key={item.value}
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
          return (
            <GroupChannelCard
              key={channel.account}
              joinDisabled={judgeIsJoined(channel.account)}
              data={channel}
              onJoin={() => {
                getGroupDetailData(channel.account).then(() => {
                  setCurGroupData(channel);
                  setOpenJoinMask(true);
                });
              }}
            ></GroupChannelCard>
          );
        })}
      </div>
      <style jsx>{`
        .content-box {
          position: relative;
        }
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
        .mask {
          position: absolute;
          z-index: 100;
          left: 0;
          right: 0;
          bottom: 0;
          top: 0;

          background: rgba(0, 0, 0, 0.3); /* 半透明背景 */

          backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  );
};

export default JoinGroupContent;
