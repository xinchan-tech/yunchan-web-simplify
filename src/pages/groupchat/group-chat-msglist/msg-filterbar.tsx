import {
  JknIcon,
  Input,
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  JknAlert,
} from "@/components";

import { KeyboardEvent, useEffect, useState } from "react";
import { cn } from "@/utils/style";
import { useUser } from "@/store";
import { useToast } from "@/hooks";
import { useGroupChatShortStore } from "@/store/group-chat-new";
import { editGroupService } from "@/api";

export type FilterKey = "live" | "owner" | "stock" | "mention";
export type ChatAuthKey = "0" | "1" | "2";

type FilterBase = {
  title: string;
  desc: string;
};
type ImFilterItem = FilterBase & {
  messageType: FilterKey;
};
type AuthFilterItem = FilterBase & {
  messageType: ChatAuthKey;
};

const MsgFilter = (props: { onFilterChange: (type: FilterKey) => void, onKeywordFilter: (str:string) => void }) => {
  const { onFilterChange, onKeywordFilter } = props;
  const { user } = useUser();
  const { toast } = useToast();
  const { groupDetailData } = useGroupChatShortStore();
  const [filterKeyWord, setFilterKeyWord] = useState("");
  const filterItems: ImFilterItem[] = [
    {
      title: "实时聊天",
      desc: "显示全部成员的消息",

      messageType: "live",
    },
    {
      title: "群主消息",
      desc: "只显示群主发的消息",

      messageType: "owner",
    },
    {
      title: "股票消息",
      desc: "只显示有股票的消息",

      messageType: "stock",
    },
    {
      title: "提到我的",
      desc: "只显示@我的消息",

      messageType: "mention",
    },
  ];

  const chatAuthItems: AuthFilterItem[] = [
    {
      title: "所有成员",
      desc: "所有成员都可以发言",

      messageType: "0",
    },
    {
      title: "群主和管理员",
      desc: "仅群主和管理员可以发言",

      messageType: "1",
    },
    {
      title: "仅群主",
      desc: "仅群主可以发言",

      messageType: "2",
    },
  ];

  const [filterItem, setFilterItem] = useState<ImFilterItem>(filterItems[0]);
  const [curAuthItem, setCurAuthItem] = useState<AuthFilterItem | null>(null);

  const [activeSearch, setActiveSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const handleEditChatAuth = (item: AuthFilterItem) => {
    JknAlert.info({
      content: (
        <div>
          <p>{item.desc}</p>
          <p className="mt-2">修改后将立即生效</p>
        </div>
      ),
      cancelBtn: true,

      onAction: async () => {
        if (groupDetailData?.account) {
          try {
            const r = await editGroupService({
              chat_type: item.messageType,
              account: groupDetailData.account,
            });

            if (r.status === 1) {
              toast({ description: "修改成功" });
            }
          } catch (err: Error) {
            if (err.message) {
              toast({ description: err.message });
            }
          }
        } else {
        }
      },
    });
  };

  const judgeIsOwner = () => {
    return user && groupDetailData && user.username === groupDetailData.owner;
  };

  const handleSearchKwd = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.keyCode === 13 && typeof onKeywordFilter === 'function') {
      onKeywordFilter(filterKeyWord)
    }
  };
  useEffect(() => {
    if (groupDetailData) {
      const target = chatAuthItems.find(
        (item) => item.messageType === groupDetailData.chat_type
      );
      if (target) {
        setCurAuthItem(target);
      }
    }
  }, [groupDetailData]);

  return (
    <div
      className={cn(
        "flex items-center  h-[40px] imchat-top pl-2 pr-2 justify-between"
      )}
    >
      <HoverCard openDelay={100} closeDelay={100}>
        <HoverCardTrigger className="flex items-center">
          <div className="left-trigger h-6 rounded-2xl leading-6 pl-4 pr-4">
            {filterItem.title || ""}
            <span className="triggerIcon ml-1"></span>
          </div>
        </HoverCardTrigger>
        <HoverCardContent
          align="center"
          side="bottom"
          className="w-fit py-1 px-2 text-sm"
        >
          <div className="im-chat-filter-content ">
            <div className="im-chat-filter-content-title h-5 leading-5">
              消息设置：
            </div>
            {filterItems.map((item) => (
              <div
                key={item.title}
                className="im-chat-filter-content-item"
                onClick={() => {
                  setFilterItem(item);
                  typeof onFilterChange === "function" &&
                    onFilterChange(item.messageType);
                }}
              >
                <div className="flex items-center w-6">
                  {filterItem.messageType === item.messageType && (
                    <JknIcon name="dagou_white" className="h-4 w-4 mr-2" />
                  )}
                </div>
                <div className="">
                  <div className="im-chat-filter-content-item-title">
                    {item.title}
                  </div>
                  <div className="im-chat-filter-content-item-desc">
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
            {judgeIsOwner() === true && (
              <>
                <div className="im-chat-filter-content-title h-5 leading-5">
                  发言设置：
                </div>
                {chatAuthItems.map((item) => (
                  <div
                    key={item.title}
                    className="im-chat-filter-content-item"
                    onClick={() => {
                      handleEditChatAuth(item);
                    }}
                  >
                    <div className="flex items-center w-6">
                      {curAuthItem?.messageType === item.messageType && (
                        <JknIcon name="dagou_white" className="h-4 w-4 mr-2" />
                      )}
                    </div>
                    <div className="">
                      <div className="im-chat-filter-content-item-title">
                        {item.title}
                      </div>
                      <div className="im-chat-filter-content-item-desc">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>

      <div className="flex im-qiuck-buttons items-center">
        <div className="im-chat-button">
          <div
            className={cn(
              "animate-input  border-dialog-border rounded-sm  bg-accent inline-block",
              activeSearch === true && "border border-solid"
            )}
            style={{
              height: "22px",
              width: activeSearch === true ? "200px" : "0",
            }}
          >
            <Input
              className="border-none placeholder:text-tertiary "
              placeholder="请输入内容"
              style={{ lineHeight: "22px", height: "22px" }}
              onKeyDown={handleSearchKwd}
              onChange={(e) => {
                setFilterKeyWord(e.target.value);
              }}
              value={filterKeyWord}
              size={"sm"}
            />
          </div>
          <HoverCard openDelay={300} closeDelay={300}>
            <HoverCardTrigger className="flex items-center">
              <div
                className="ml-2 inline-block"
                onClick={() => {
                  if (activeSearch === false) {
                    setActiveSearch(true);
                    setShowFilter(true);
                  } else {
                    setActiveSearch(false);
                    setFilterKeyWord('')
                    typeof onKeywordFilter === 'function' && onKeywordFilter('')
                    let timer = setTimeout(() => {
                      clearTimeout(timer);
                      setShowFilter(false);
                    }, 300);
                  }
                }}
              >
                <JknIcon
                  name={activeSearch === true ? "search_active" : "search"}
                />
              </div>
            </HoverCardTrigger>
            <HoverCardContent
              align="center"
              side="bottom"
              className="w-fit py-1 px-2 text-sm"
            >
              搜索消息
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
      <style jsx>
        {`
            .imchat-top {
                border-bottom: 1px solid rgb(50,50,50)
            }
            .animate-input {
                transition: width 0.3s;
                width: 0;
            }
          .left-trigger {
            background-color: rgb(56, 97, 246);
            color: #fff;
          }
          .triggerIcon {
            display: inline-block;
            border-right: 0.25rem solid transparent;
            border-left: 0.25rem solid transparent;
            border-bottom: 0.25rem solid transparent;
            border-top: 0.35rem solid #fff;
          }

            .im-chat-button {
                display: flex;
                align-items: center;
            }

          .im-chat-filter-content {
            width: 16.875rem;
          }
            .im-chat-filter-content-title {
                padding: 0.125rem;
            }
            .im-chat-filter-content-item {
                padding: 0.25rem;
                display: flex;
                align-items: center;
                border-bottom: 0.0625rem solid hsl(var(--border));
                &:last-child {
                    border-bottom: none;
                }
                &:hover {
                    background-color: hsl(var(--primary));
                    color: #fff;
                }
            }
        }
                `}
      </style>
    </div>
  );
};

export default MsgFilter;
