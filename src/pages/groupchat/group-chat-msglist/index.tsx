import {
  useGroupChatStoreNew,
  useGroupChatShortStore,
} from "@/store/group-chat-new";
import { useEffect, useRef, UIEventHandler, useMemo, useState } from "react";
import { Message, MessageText, MessageImage } from "wukongimjssdk";

import { useImperativeHandle, forwardRef, ReactNode } from "react";
import ImageCell from "../Messages/Image";
import SystemCell from "../Messages/system";
import TextCell from "../Messages/text";

import { MessageWrap } from "../Service/Model";
import ReplyMsg from "../components/reply-msg";
import { cn } from "@/utils/style";
import { sortMessages } from "../chat-utils";
import MsgFilter, { FilterKey } from "./msg-filterbar";
import { useUser } from "@/store";

import { useShallow } from "zustand/react/shallow";

const GroupChatMsgList = forwardRef(
  (
    props: {
      messages: Message[];
      handleScroll: UIEventHandler<HTMLDivElement>;
      handleFindPrevMsg: (messageSeq: number) => void;
      loading?: boolean
    },
    ref
  ) => {
    const { messages, handleFindPrevMsg } = props;
    const { bottomHeight } = useGroupChatStoreNew();
    const { user } = useUser();

    const scrollDomRef = useRef<HTMLElement | null>(null);

    const {
      setFilterMode,
      groupDetailData,
      setLocatedMessageId,
      locatedMessageId,
    } = useGroupChatShortStore(
      useShallow((state) => {
        return {
          setFilterMode: state.setFilterMode,
          groupDetailData: state.groupDetailData,
          setLocatedMessageId: state.setLocatedMessageId,
          locatedMessageId: state.locatedMessageId,
        };
      })
    );

    const getMessage = (m: Message) => {
      if (m instanceof Message) {
        const streams = m.streams;
        let text: string | ReactNode = "";
        const messageWrap = new MessageWrap(m);
        if (m.content instanceof MessageText) {
          text = <TextCell message={m} messageWrap={messageWrap} />;
        } else if (m.content instanceof MessageImage) {
          text = <ImageCell message={m}></ImageCell>;
        }
        //  else {
        //   text = <SystemCell message={m} />;
        // }

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
    const [filterType, setFilterType] = useState<FilterKey>("live");
    const [filterKeyWord, setFilterKeyWord] = useState("");

    const goodMessages = useMemo(() => {
      let result: Message[] = [];
      if (messages instanceof Array && messages.length > 0) {
        result = sortMessages(messages);
      }

      switch (filterType) {
        case "owner":
          result = result.filter((msg) => {
            return msg.fromUID === groupDetailData?.owner;
          });
          break;
        case "mention":
          result = result.filter((msg) => {
            let result = false;
            if (
              msg.content &&
              msg.content.mention &&
              msg.content.mention.uids instanceof Array &&
              msg.content.mention.uids.indexOf(user?.username) >= 0
            ) {
              result = true;
            }
            return result;
          });
          break;
        default:
          break;
      }
      if (filterKeyWord) {
        result = result.filter((item) => {
          let res = false;
          if (
            item.content instanceof MessageText &&
            item.content.text &&
            item.content.text.indexOf(filterKeyWord) >= 0
          ) {
            res = true;
          }
          return res;
        });
      }
      if(result.length !== messages.length) {
        setFilterMode(true)
      } else {
        setFilterMode(false)
      }
      return result;
    }, [messages, filterType, filterKeyWord]);

    useEffect(() => {
      console.log(messages, "originMessages");
    }, [messages]);

    useImperativeHandle(ref, () => ({
      scrollToBottom: () => {
        if (scrollDomRef.current) {
          scrollDomRef.current.scrollTop = scrollDomRef.current.scrollHeight;
        }
      },
      judgeNotOver: () => {
        if (scrollDomRef.current) {
          return (
            scrollDomRef.current.scrollHeight <=
            scrollDomRef.current.offsetHeight
          );
        }
        return true;
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

    // 定位到引用消息位置
    const locateMessage = (messageSeq: number) => {
      typeof handleFindPrevMsg === "function" && handleFindPrevMsg(messageSeq);
    };

    return (
      <div
        className="group-chat-msglist"
        style={{ height: `calc(100% - ${bottomHeight}px)` }}
      >
        <MsgFilter
          onFilterChange={(type) => setFilterType(type)}
          onKeywordFilter={(word) => {
            setFilterKeyWord(word);
          }}
        />
        <div
          style={{ height: `calc(100% - 40px)` }}
          ref={scrollDomRef}
          className="scroll-content"
          onScroll={handleScroll}
          id="group-chat-msglist"
        >
          {(goodMessages || []).map((msg: Message, idx: number) => {
            const key = msg.clientMsgNo + idx;

            return (
              <div
                key={key}
                id={msg.clientMsgNo}
                onMouseLeave={() => {
                  if (locatedMessageId === msg.clientMsgNo) {
                    setLocatedMessageId("");
                  }
                }}
                className={cn(
                  "message-item",
                  locatedMessageId === msg.clientMsgNo && "located"
                )}
              >
                {getMessage(msg)}
                {msg.content?.reply && msg.content?.revoke !== true && (
                  <ReplyMsg
                    locateMessage={locateMessage}
                    message={msg}
                  ></ReplyMsg>
                )}
              </div>
            );
          })}
        </div>

        <style jsx>
          {`
             {
              .message-item {
                transition: background linear 0.4s;
              }
              .message-item.located {
                background-color: rgb(69, 70, 73);
              }
              .group-chat-msglist {
              }
              .scroll-content {
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
