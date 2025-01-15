import { Subscriber } from "wukongimjssdk";
import ChatAvatar from "../components/chat-avatar";
import { useGroupChatShortStore } from "@/store/group-chat-new";
import {
  JknIcon,
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  ContextMenuItem,
} from "@/components";

import { useUser } from "@/store";
import { useToast } from "@/hooks";
import {
  forbiddenServicePyload,
  setMemberForbiddenService,
  setManagerServicePayload,
  setGroupManagerService,
} from "@/api";
import { useContext, useState } from "react";
import { GroupChatContext } from "..";

const GroupMembers = (props: { subscribers: Subscriber[] }) => {
  const { syncSubscriber, handleReply } = useContext(GroupChatContext);
  const { subscribers } = props;

  const groupDetailData = useGroupChatShortStore(
    (state) => state.groupDetailData
  );
  const { user } = useUser();
  const { toast } = useToast();
  const conversationWraps = useGroupChatShortStore(
    (state) => state.conversationWraps
  );

  const judgeHasLaheiAuth = () => {
    const self = subscribers.find((item) => item.uid === user?.username);
    if (self) {
      return self.orgData.type === "1" || self.orgData.type === "2";
    }
  };

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

  return (
    <div className="h-full">
      <div className="group-notice">
        <div className="box-title flex items-center">群公告</div>
        <div className="text-xs p-2" style={{ color: "rgb(125,129,138)" }}>
          {groupDetailData?.notice || ""}
        </div>
      </div>
      <div className="group-members">
        <div className="box-title flex items-center">活跃成员</div>
        {subscribers.map((item) => {
          return (
            <div
              key={item.uid}
              className="member-item flex items-center justify-between"
            >
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <div className="flex h-full items-center w-[200px]">
                    <ChatAvatar data={item} size="sm" />
                    <div className="flex w-full h-full items-center">
                      <div className="member-name overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.name}
                      </div>
                      {item.orgData?.type === "2" && <JknIcon name="owner" />}
                      {item.orgData?.forbidden === "1" && (
                        <JknIcon name="forbidden" />
                      )}
                      {item.orgData?.type === "1" && <JknIcon name="manager" />}
                    </div>
                  </div>
                </ContextMenuTrigger>
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
                  {judgeHasLaheiAuth() === true && (
                    <ContextMenuItem
                      onClick={() => {
                        handleLahei(item);
                      }}
                    >
                      {item.orgData?.forbidden === "0"
                        ? "添加黑名单"
                        : "解除黑名单"}
                    </ContextMenuItem>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            </div>
          );
        })}
      </div>

      <style jsx>{`
         {
          .group-notice {
            height: 200px;
            border-bottom: 1px solid rgb(50, 50, 50);
          }
          .group-members {
            height: calc(100% - 200px);
            overflow-y: auto;
          }
          .box-title {
            height: 30px;
            font-size: 12px;
            color: rgb(118, 125, 136);
            padding-left: 10px;
          }
          .member-item {
            margin-top: 6px;
            height: 20px;
            padding: 0 10px;
          }

          .member-avatar {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            margin-right: 6px;
          }
          .member-name {
            margin-left: 6px;
            max-width: calc(100% - 50px);
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default GroupMembers;
