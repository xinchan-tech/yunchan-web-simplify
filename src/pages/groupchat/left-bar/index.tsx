import { JknIcon } from "@/components";
import ChatAvatar from "../components/chat-avatar";
import { useUser } from "@/store";

const GroupChatLeftBar = () => {
  const { user } = useUser();
  return (
    <div className="w-[68px] left-bar-cont">
      <div className="left-bar-item flex justify-center">
        <ChatAvatar
          radius="8px"
          className="w-12 h-12"
          data={{
            avatar: user?.avatar || "",
            name: user?.realname || "",
            uid: user?.username || "",
          }}
        />
      </div>
      <div className="left-bar-item flex justify-center">
        <div className="w-12 h-12 flex flex-col justify-center items-center activebar">
          <JknIcon name="group_chat_primary"></JknIcon>
          <div
            className="text-xs mt-1 "
            style={{
              color: "#6052FF",
            }}
          >
            消息
          </div>
        </div>
      </div>
      <style jsx>
        {`
           {
            .left-bar-cont {
              padding: 20px 10px;
              width: 68px;
              height: 100%;

              background-color: rgb(30, 32, 34);
            }
            .activebar {
              border-radius: 8px;
              background-color: rgb(53, 54, 55);
            }
            .left-bar-item {
              width: 100%;
              height: 50px;
              border-radius: 8px;
              margin-bottom: 14px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default GroupChatLeftBar;
