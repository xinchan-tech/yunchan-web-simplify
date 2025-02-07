import { useContext, useEffect, useRef, useState } from "react";
import { GroupChatContext } from "..";
import { Subscriber } from "wukongimjssdk";
import { useUser } from "@/store";
import { useToast } from "@/hooks";
import { useGroupChatShortStore } from "@/store/group-chat-new";
import {
  setGroupManagerService,
  setManagerServicePayload,
  forbiddenServicePyload,
  setMemberForbiddenService,
} from "@/api";
import { throttle } from "radash";
import { ContextMenuContent, ContextMenuItem } from "@/components";
import { useLatest } from "ahooks";
export const useMemberSetting = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const { syncSubscriber, handleReply } = useContext(GroupChatContext);
  const subscribers = useGroupChatShortStore((state) => state.subscribers);
  const conversationWraps = useGroupChatShortStore(
    (state) => state.conversationWraps
  );

  const groupDetailData = useGroupChatShortStore(
    (state) => state.groupDetailData
  );
  const judgeSetManagerAuth = (member: Subscriber) => {
    return (
      user &&
      groupDetailData &&
      user.username === groupDetailData.owner &&
      member.orgData?.type !== "2"
    );
  };

  const handleSetManager = async (item: Subscriber) => {
    if (groupDetailData) {
      let data: setManagerServicePayload = {
        channelId: groupDetailData.account,
        username: item.uid,
        type: "1",
      };
      if (item.orgData.type === "1") {
        data.type = "0";
      }
      try {
        const resp = await setGroupManagerService(data);
        if (resp && resp.status === 1) {
          toast({
            description:
              data.type === "1" ? "设置管理员操作成功" : "取消管理员操作成功",
          });
          // 同步一下群成员
          if (conversationWraps && conversationWraps.length > 0) {
            const currenntChannel = conversationWraps.find(
              (item) => item.channel.channelID === groupDetailData.account
            );
            if (currenntChannel) {
              typeof syncSubscriber === "function" &&
                syncSubscriber(currenntChannel.channel);
            }
          }
        }
      } catch (err: Error) {
        if (err?.message) {
          toast({ description: err.message });
        }
      }
    }
  };

  const handleLahei = async (item: Subscriber) => {
    if (groupDetailData) {
      let data: forbiddenServicePyload = {
        channelId: groupDetailData.account,
        uids: [item.uid],
        forbidden: "0",
      };

      if (item.orgData.forbidden === "0") {
        data.forbidden = "1";
        if (item.orgData.type === "1") {
          toast({ description: "请先取消对方管理员权限再拉黑" });
          return;
        }
      }
      try {
        const resp = await setMemberForbiddenService(data);

        if (resp) {
          if (resp.status === 1) {
            toast({
              description:
                data.forbidden === "1" ? "禁言操作成功" : "取消禁言操作成功",
            });
          }
        }
      } catch (err: Error) {
        if (err?.message) {
          toast({ description: err.message });
        }
      }
    }
  };

  const judgeHasLaheiAuth = (member: Subscriber) => {
    // 拉黑不了群主
    if (member.orgData.type === "2") {
      return;
    }
    const self = subscribers.find((item) => item.uid === user?.username);
    if (self) {
      return self.orgData.type === "1" || self.orgData.type === "2";
    }
  };

  const renderContextMenu = (item: Subscriber) => {
    return (
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => {
            handleReply({ quickReplyUserId: item.uid });
          }}
        >
          回复用户
        </ContextMenuItem>
        {judgeSetManagerAuth(item) && (
          <ContextMenuItem
            onClick={() => {
              handleSetManager(item);
            }}
          >
            {item.orgData.type === "1" ? "取消管理员" : "设为管理员"}
          </ContextMenuItem>
        )}
        {judgeHasLaheiAuth(item) === true && (
          <ContextMenuItem
            onClick={() => {
              handleLahei(item);
            }}
          >
            {item.orgData?.forbidden === "0" ? "添加黑名单" : "解除黑名单"}
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    );
  };

  return { renderContextMenu };
};

export const useScrollToBottomOnArrowClick = (
  targetRef: React.RefObject<HTMLElement>
) => {
  const arrowRef = useRef<HTMLDivElement | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const unreadCountRef = useLatest(unreadCount);

  const renderTip = (num: number) => {
    return `<div class='flex h-8 items-center rounded-full pl-4 pr-4 text-white' style="background-color: rgba(0,0,0,0.4)">&#9660;&nbsp;有${num}条未读消息<div>`;
  };

  useEffect(() => {
    const targetElement = targetRef.current;
    if (!targetElement) return;

    // 创建向下箭头元素
    const arrow = document.createElement("div");
    arrow.style.position = "absolute";
    arrow.style.bottom = "10px";
    arrow.style.right = "10px";
    arrow.style.zIndex = "99";
    arrow.style.cursor = "pointer";
    arrow.innerHTML = renderTip(unreadCount); // 向下箭头符号
    arrow.style.display = "none"; // 初始时隐藏箭头

    targetElement.appendChild(arrow);
    arrowRef.current = arrow;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = targetElement;
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;
      if (distanceToBottom < 100) {
        arrow.style.display = "none";
      }

      // 当滚动到底部时，重置未读消息计数
      if (distanceToBottom === 0) {
        setUnreadCount(0);
      }
    };
    const goodScroll = throttle({ interval: 200 }, handleScroll);

    const handleArrowClick = () => {
      if (targetElement) {
        targetElement.scrollTop = targetElement.scrollHeight;
        setUnreadCount(0);
      }
    };

    targetElement.addEventListener("scroll", goodScroll);
    arrow.addEventListener("click", handleArrowClick);

    return () => {
      if (arrowRef.current) {
        arrowRef.current.removeEventListener("click", handleArrowClick);
        if (targetElement.contains(arrowRef.current)) {
          targetElement.removeChild(arrowRef.current);
        }
      }
      targetElement.removeEventListener("scroll", goodScroll);
    };
  }, [targetRef]);

  useEffect(() => {
    try {
      if (arrowRef.current && targetRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = targetRef.current;
        const distanceToBottom = scrollHeight - scrollTop - clientHeight;
        if (unreadCount > 0 && distanceToBottom >= 200) {
          arrowRef.current.style.display = "block";
        }
      }
    } catch (er) {}
  }, [unreadCount]);

  // 提供一个函数用于增加未读消息计数
  const incrementUnreadCount = () => {
    setUnreadCount((prevCount) => {
      const newCount = prevCount + 1;
      if (arrowRef.current) {
        arrowRef.current.innerHTML = renderTip(newCount);
      }
      return newCount;
    });
  };

  return { incrementUnreadCount };
};
