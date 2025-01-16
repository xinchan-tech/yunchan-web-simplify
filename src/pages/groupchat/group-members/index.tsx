import ChatAvatar from "../components/chat-avatar";
import { useGroupChatShortStore } from "@/store/group-chat-new";
import { JknIcon, ContextMenu, ContextMenuTrigger } from "@/components";

import { useMemberSetting } from "../hooks";

const GroupMembers = () => {
  const subscribers = useGroupChatShortStore((state) => state.subscribers);
  const groupDetailData = useGroupChatShortStore(
    (state) => state.groupDetailData
  );

  const { renderContextMenu } = useMemberSetting();

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
                {renderContextMenu(item)}
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
