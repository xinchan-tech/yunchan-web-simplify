import { cn } from "@/utils/style";
import WKSDK, {
  Message,
  Channel,
  ChannelTypePerson,
  MessageStatus,
  ChannelInfo,
} from "wukongimjssdk";
import ChatAvatar from "../chat-avatar";
import { ContextMenu, ContextMenuTrigger } from "@/components";
import { useMemberSetting } from "../../hooks";
import { useGroupChatShortStore } from "@/store/group-chat-new";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getTimeStringAutoShort2,
  judgeIsUserInSyncChannelCache,
  setPersonChannelCache,
  setUserInSyncChannelCache,
} from "../../chat-utils";
const MsgHead = (props: { message: Message; type: "left" | "right" }) => {
  const { message, type } = props;
  const subscribers = useGroupChatShortStore((state) => state.subscribers);
  const { renderContextMenu } = useMemberSetting();
  // 群成员
  const member = useMemo(() => {
    let result = null;
    if (subscribers instanceof Array && subscribers.length > 0) {
      const target = subscribers.find((item) => item.uid === message.fromUID);
      if (target) {
        result = target;
      }
    }
    return result;
  }, [subscribers, message]);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | undefined>();
  const fetchingChannel = useRef(false);
  useEffect(() => {
    if(message) {

      const temp = WKSDK.shared().channelManager.getChannelInfo(
        new Channel(message.fromUID, ChannelTypePerson)
      );
      if (temp) {
        setChannelInfo(temp);
      } else if (fetchingChannel.current === false) {
        fetchingChannel.current = true;
       
  
        if (judgeIsUserInSyncChannelCache(message.fromUID)) {
          return;
        } else {
          setUserInSyncChannelCache(message.fromUID,true)
  
          setPersonChannelCache(message.fromUID).then(() => {
            const temp = WKSDK.shared().channelManager.getChannelInfo(
              new Channel(message.fromUID, ChannelTypePerson)
            );
            if (temp) {
              setChannelInfo(temp);
            }
            fetchingChannel.current = false;
            setUserInSyncChannelCache(message.fromUID,false)
          });
        }
      }
    }
  }, [message]);

  const getMessageStatus = () => {
    if (!message.send) {
      return "";
    }
    if (message.status === MessageStatus.Fail) {
      return "发送失败";
    }
    if (message.status === MessageStatus.Wait) {
      return "发送中";
    }

    return "已发送";
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "absolute user-name text-nowrap",
          type === "left" ? "left-name" : "right-name"
        )}
      >
        {channelInfo?.title}
        {type === "left" && (
          <span className="ml-2 text-gray-400">
            {getTimeStringAutoShort2(message.timestamp * 1000, true)}
          </span>
        )}
      </div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div>
            <ChatAvatar
              data={{
                name: channelInfo?.title || "",
                avatar: channelInfo?.logo || "",
                uid: channelInfo?.channel.channelID || "",
              }}
              radius="8px"
            />
          </div>
        </ContextMenuTrigger>
        {member && renderContextMenu(member)}
      </ContextMenu>

      <div>
        <div className="text-xs mt-2 text-gray-500">{getMessageStatus()}</div>
      </div>
      <style jsx>
        {`
          .user-name {
            font-size: 12px;
            color: rgb(15, 132, 241);
            min-width: 100px;
            top: 0;
          }
          .left-name {
            left: 58px;
            text-align: left;
          }
          .right-name {
            right: 58px;
            text-align: right;
          }
        `}
      </style>
    </div>
  );
};

export default MsgHead;
