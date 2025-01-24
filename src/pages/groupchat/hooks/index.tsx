import { useContext } from "react";
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
import { ContextMenuContent, ContextMenuItem } from "@/components";
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
        if(item.orgData.type === '1') {
          toast({description: '请先取消对方管理员权限再拉黑'})
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
    if(member.orgData.type === '2') {
      return
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
