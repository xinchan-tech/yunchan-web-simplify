import useGroupChatStore from "@/store/group-chat";
import MsgCard from "./msg-card";
import type { MsgCardProps } from "./msg-card";
import MsgInputer from "./msg-inputer";


const ImChatMiddle = () => {
  const bottomHeight = useGroupChatStore((state) => state.bottomHeight);
  const fullScreen = useGroupChatStore((state) => state.fullScreen);
  const msgList: MsgCardProps[] = [
    {
      sender: {
        avatar: "",
        name: "小明",
      },
      msg: "你好",
      receiver: "all",
      time: "2021-08-01",
      type: "text",
    },
  ];

  const fillList = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
  ];

  return (
    <div
      className="im-chat-middle-container"
      style={{
        height:
          fullScreen === true
            ? `calc(100% - 82px)`
            : `calc(100% - ${bottomHeight + 82}px)`,
      }}
    >
      <div className="im-chat-middle-scroller">
        <div className="text-center h-6 leading-6 text-gray-400 text-sm">
          xxxx 创建了社群
        </div>
        {fillList.map((item) => {
          return <MsgCard {...msgList[0]} key={item} />;
        })}
      </div>

      <MsgInputer />
      <style jsx>{`
         {
          .im-chat-middle-container { 
             padding-bottom: 34px;
          }
          .im-chat-middle-scroller {
            height: 100%;
            overflow-y: auto;
            ::-webkit-scrollbar {
              display: block;
              width: 6px;
            }
           
            ::-webkit-scrollbar-thumb {
              background-color: rgb(88, 88, 88);
            }
            scrollbar-thumb {
              background-color: rgb(88, 88, 88);
            }
          }
          .im-chat-middle-container {
            position: relative;
            border-top: 0.0625rem solid hsl(var(--border));
          }
        }
      `}</style>
    </div>
  );
};

export default ImChatMiddle;
