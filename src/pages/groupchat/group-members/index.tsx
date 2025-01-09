import { Subscriber } from "wukongimjssdk";
import ChatAvatar from "../components/chat-avatar";
const GroupMembers = (props: { subscribers: Subscriber[] }) => {
  const { subscribers } = props;

  return (
    <div className="h-full">
      <div className="group-notice">
      <div className="box-title flex items-center">群公告</div>
      </div>
      <div className="group-members">
        <div className="box-title flex items-center">活跃成员</div>
        {subscribers.map((item) => {
          return (
            <div
              key={item.uid}
              className="member-item flex items-center justify-between"
            >
              <div className="flex h-full items-center w-[200px]">
                <ChatAvatar data={item} size="sm"/>
                <div className="member-name overflow-hidden text-ellipsis whitespace-nowrap">
                  {item.name}
                </div>
              </div>
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
            width: calc(100% - 28px);
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default GroupMembers;
