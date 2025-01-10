import { cn } from "@/utils/style";
import { Message } from "wukongimjssdk";

import MsgHead from "../msg-head";
import { ReactNode, useContext } from "react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  ContextMenuItem,
} from "@/components";
import { GroupChatContext, ReplyFn } from "../..";

const MsgCard = (props: { data: Message; children: string | ReactNode }) => {
  const { data } = props;

  const { handleReply } = useContext(GroupChatContext);
  return (
    <div
      key={data.clientMsgNo}
      className={cn(
        "flex msg-card items-start",
        data.send && "justify-end",
        data.content.reply ? "mb-2" : "mb-6"
      )}
    >
      {data.send !== true && (
        <div className="w-12 h-full rounded-md  left">
          <MsgHead message={data} type="left" />
        </div>
      )}

      <div
        className={cn(
          "bubble  rounded-lg relative",
          data.send && "right-bubble"
        )}
      >
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <span>{props.children}</span>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={() => {
                typeof handleReply === "function" && handleReply(data, true);
              }}
            >
              引用
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                typeof handleReply === "function" && handleReply(data);
              }}
            >
              回复
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>

      {data.send === true && (
        <div className="w-12 h-full rounded-md  right">
          <MsgHead message={data} type="right" />
        </div>
      )}
      <style>
        {`
  
                .sedn-card {

                }
                .msg-card {
                    height: auto;
                }
                .bubble {
                    background-color: rgb(65, 65, 65);
                    color: #fff;
                    padding: 12px;
                    margin-left: 10px;
                    min-height: 40px;
                    box-sizing: border-box;
                    display: flex;
                    align-items: center;
                    margin-top: 20px;
                }
                .bubble :before {
                    content: "";
                    position: absolute;
                    left: -10px;
                    top: 0;
                    display: inline-block;
                    width: 10px;
                    height: 40px;
                    background-color: rgb(65, 65, 65);
                    clip-path: polygon(0 10px, 10px 12px, 10px 26px);
                }
                .bubble.right-bubble {
                     margin-right: 10px;
                }
                .bubble.right-bubble :before{
                    right: -10px;
                    left: auto;
                    clip-path: polygon(10px 10px, 0px 12px, 0px 26px);
                }
            
        `}
      </style>
    </div>
  );
};

export default MsgCard;
