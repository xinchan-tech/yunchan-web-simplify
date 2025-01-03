import HoverPopover from "./hover-popover";
import JknIcon from "../jkn/jkn-icon";
import useGroupChatStore from "@/store/group-chat";
import { Input } from "../ui/input";
import { useState } from "react";
import { cn } from "@/utils/style";


type ImFilterItem = {
  title: string;
  desc: string;
  handler: () => void;
  messageType: "live" | "owner" | "stock" | "mention";
};

const ImChatTop = () => {
  const filterItems: ImFilterItem[] = [
    {
      title: "实时聊天",
      desc: "显示全部成员的消息",
      handler: () => {},
      messageType: "live",
    },
    {
      title: "群主消息",
      desc: "只显示群主发的消息",
      handler: () => {},
      messageType: "owner",
    },
    {
      title: "股票消息",
      desc: "只显示有股票的消息",
      handler: () => {},
      messageType: "stock",
    },
    {
      title: "提到我的",
      desc: "只显示@我的消息",
      handler: () => {},
      messageType: "mention",
    },
  ];

  const messageType = useGroupChatStore((state) => state.messageType);
  const setMessageType = useGroupChatStore((state) => state.setMessageType);
  const fullScreen = useGroupChatStore((state) => state.fullScreen);
  const setFullScreen = useGroupChatStore((state) => state.setFullScreen);

  const [activeSearch, setActiveSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  return (
    <div
      className={cn(
        "flex items-center  h-12 im-chat-top pl-2 pr-2",
        showFilter === true ? "justify-end" : "justify-between"
      )}
    >
      {showFilter !== true && (
        <HoverPopover
          triggerTitle={
            <div className="left-trigger h-6 rounded-2xl leading-6 pl-4 pr-4">
              实时聊天
              <span className="triggerIcon ml-1"></span>
            </div>
          }
          contentClassName="w-auto"
          content={
            <div className="im-chat-filter-content ">
              <div className="im-chat-filter-content-title h-5 leading-5">
                消息设置：
              </div>
              {filterItems.map((item) => (
                <div
                  key={item.title}
                  className="im-chat-filter-content-item"
                  onClick={() => setMessageType(item.messageType)}
                >
                  <div className="flex items-center w-6">
                    {messageType === item.messageType && (
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
            </div>
          }
        />
      )}

      <div className="flex im-qiuck-buttons items-center">
        <div className="im-chat-button">
          {activeSearch === false && (
            <HoverPopover
              content="缩放窗口"
              triggerTitle={
                <div className="ml-2 inline-block" onClick={() => {
                    setFullScreen(!fullScreen)
                }}>
                  <JknIcon name="scale" />
                </div>
              }
              contentClassName="w-auto h-7 leading-7 pl-1 pr-1"
            />
          )}
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
              size={"sm"}
            />
          </div>
          <HoverPopover
            content="搜索消息"
            triggerTitle={
              <div
                className="ml-2 inline-block"
                onClick={() => {
                  if (activeSearch === false) {
                    setActiveSearch(true);
                    setShowFilter(true)
                  } else {
                    setActiveSearch(false);
                    let timer = setTimeout(() => {
                      clearTimeout(timer);
                      setShowFilter(false)
                    }, 300);
                  }
                }}
              >
                <JknIcon
                  name={activeSearch === true ? "search_active" : "search"}
                />
              </div>
            }
            contentClassName="w-auto h-7 leading-7 pl-1 pr-1"
          />
          <HoverPopover
            content="群公告"
            triggerTitle={
              <div className="ml-2 inline-block">
                <JknIcon name="sound" />
              </div>
            }
            contentClassName="w-auto h-7 leading-7 pl-1 pr-1"
          />
        </div>
      </div>
      <style jsx>
        {`
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

export default ImChatTop;
