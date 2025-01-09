import { useGroupChatStoreNew } from "@/store/group-chat-new";
import { useEffect, useRef, UIEventHandler } from "react";
import { Message, MessageText, MessageImage } from "wukongimjssdk";

import { useImperativeHandle, forwardRef, ReactNode } from "react";
import ImageCell from "../Messages/Image";
import SystemCell from "../Messages/system";
import TextCell from "../Messages/text";

import { useUpdate } from "ahooks";
import { MessageWrap } from "../Service/Model";

const GroupChatMsgList = forwardRef(
  (
    props: {
      messages: Message[];
      handleScroll: UIEventHandler<HTMLDivElement>;
    },
    ref
  ) => {
    const { messages } = props;
    const { bottomHeight } = useGroupChatStoreNew();
    const scrollDomRef = useRef<HTMLElement | null>(null);
    const update = useUpdate()

    const getMessage = (m: Message, key: string) => {
      if (m instanceof Message) {
        const streams = m.streams;
        let text: string | ReactNode = "";
        const messageWrap = new MessageWrap(m)
        if (m.content instanceof MessageText) {
          text = <TextCell key={key} message={m} messageWrap={messageWrap} />;
        } else if (m.content instanceof MessageImage) {
          text = <ImageCell key={key} message={m}></ImageCell>;
        } else {
          text = <SystemCell key={key} message={m.content} />;
        }

        if (streams && streams.length > 0) {
          // 流式消息拼接
          for (const stream of streams) {
            if (stream.content instanceof MessageText) {
              const messageText = stream.content as MessageText;
              text = text + (messageText.text || "");
            }
          }
        }
        return text;
      }

      return "未知消息";
    };

    // 更新message时，查询聊发送人头像和姓名信息，并缓存
    useEffect(() => {
      console.log(messages, "messages");
      // const cacheTaskList:Promise<{avatar: string, name: string}>[] = []
      // if (messages instanceof Array && messages.length > 0) {
      //   messages.forEach((m) => {
      //     if (fromUIDList.indexOf(m.fromUID) < 0) {
      //       fromUIDList.push(m.fromUID);
      //       cacheTaskList.push(setPersonChannelCache(m.fromUID))
      //     }
      //   });
      //   if(cacheTaskList.length > 0) {

      //     // 请求完了再更新
      //     Promise.all(cacheTaskList).then(() => {
      //       update()
      //     })
      //   }
      // }

      //
    }, [messages, update]);

    useImperativeHandle(ref, () => ({
      scrollToBottom: () => {
        if (scrollDomRef.current) {
          scrollDomRef.current.scrollTop = scrollDomRef.current.scrollHeight;
        }
      },
      scrollTo: (position: number) => {
        if (scrollDomRef.current) {
          scrollDomRef.current.scrollTop = position;
        }
      },
    }));

    // 滚动事件，距离顶部小于minHeight 时通知外面加载前面的消息
    const handleScroll: UIEventHandler<HTMLDivElement> = (e: any) => {
      typeof props.handleScroll === "function" && props.handleScroll(e);
    };

    return (
      <div
        className="group-chat-msglist"
        style={{ height: `calc(100% - ${bottomHeight}px)` }}
        ref={scrollDomRef}
        onScroll={handleScroll}
      >
        {(messages || []).map((msg: Message, idx: number) => {
          const key = msg.clientMsgNo + idx;
          return (
            <div key={key} id={msg.clientMsgNo}>
              {getMessage(msg, key)}
            </div>
          );
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
  }
);

export default GroupChatMsgList;
