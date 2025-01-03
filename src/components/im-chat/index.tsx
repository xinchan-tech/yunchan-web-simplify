import ImChatTop from "./im-chat-top";
import ImChatMiddle from "./im-chat-middle";
import ImChatBottom from "./im-chat-bottom";
import { Resizable } from "re-resizable";
import useGroupChatStore from "@/store/group-chat";

const ImChat = () => {
  const fullScreen = useGroupChatStore((state) => state.fullScreen);
  return (
    <Resizable
      minWidth={280}
      maxWidth={550}
      defaultSize={{ width: 280 }}
      enable={{ left: true }}
    >
      <div className="im-chat-container">
        <ImChatTop />
        <ImChatMiddle />
        {fullScreen === false && <ImChatBottom />}

        <style jsx>{`
          {
            .im-chat-container {

              border: 0.0625rem solid hsl(var(--border));
              height: 100%;
            }
          
        `}</style>
      </div>
    </Resizable>
  );
};

export default ImChat;
