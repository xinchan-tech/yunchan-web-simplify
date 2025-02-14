import { JknIcon } from "@/components";
import ChatAvatar from "../components/chat-avatar";
import { useUser } from "@/store";
import { cn } from "@/utils/style";

const GroupChatLeftBar = (props: {
  indexTab: "chat" | "live";
  onTabChange: (tab: "chat" | "live") => void;
}) => {
  const { user } = useUser();

  const tabs: Array<{
    name: string;
    icon: string;

    value: "chat" | "live";
  }> = [
    {
      name: "消息",
      icon: "group_chat",

      value: "chat",
    },
    {
      name: "图文直播",
      icon: "right_menu_5",

      value: "live",
    },
  ];
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
      <div className="left-bar-item flex justify-center flex-wrap">
        {tabs.map((tab) => {
          return (
            <div
              key={tab.value}
              onClick={() => {
                typeof props.onTabChange === "function" &&
                  props.onTabChange(tab.value);
              }}
              className={cn(
                "w-12 h-12 flex flex-col justify-center items-center  mb-2",
                props.indexTab === tab.value && "activebar"
              )}
            >
              <JknIcon
                className={cn(
                  props.indexTab === tab.value && "active-icon",
                  "rounded-none"
                )}
                name={tab.icon}
              ></JknIcon>
              <div className="text-xs mt-1 title">{tab.name}</div>
            </div>
          );
        })}
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
              img {
                filter: invert(50%) sepia(96%) saturate(6798%)
                  hue-rotate(227deg) brightness(99%) contrast(94%);
              }
            }

            .activebar .title {
              color: #6052ff;
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
