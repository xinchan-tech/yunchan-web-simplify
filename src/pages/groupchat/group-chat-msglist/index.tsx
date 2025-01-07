import { useGroupChatStoreNew } from "@/store/group-chat-new";
import { useEffect, useRef } from "react";
import { Message } from "wukongimjssdk";
import MsgCard from "./msg-card";
import { useImperativeHandle, forwardRef } from "react";

const GroupChatMsgList = forwardRef((props: { messages: Message[] }, ref) => {
  const { messages } = props;
  const { bottomHeight } = useGroupChatStoreNew();
  const scrollDomRef = useRef<HTMLElement | null>(null);

  //   useEffect(() => {
  //     console.log(messages, "messages");
  //   }, [messages]);

  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      if (scrollDomRef.current) {
        scrollDomRef.current.scrollTop = scrollDomRef.current.scrollHeight;
      }
    },
  }));

  return (
    <div
      className="group-chat-msglist"
      style={{ height: `calc(100% - ${bottomHeight}px)` }}
      ref={scrollDomRef}
    >
      {(messages || []).map((msg: Message) => {
        return <MsgCard key={msg.clientMsgNo} data={msg} />;
      })}
      <style jsx>
        {`
           {
            .group-chat-msglist {
              padding: 0 12px;
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
          }
        `}
      </style>
    </div>
  );
});

export default GroupChatMsgList;
