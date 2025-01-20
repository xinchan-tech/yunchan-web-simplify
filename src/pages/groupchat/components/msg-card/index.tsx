import { cn } from "@/utils/style";
import { Message, MessageImage, MessageText } from "wukongimjssdk";
import copy from "copy-to-clipboard";
import MsgHead from "../msg-head";
import { ReactNode, useContext } from "react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  ContextMenuItem,
} from "@/components";
import { GroupChatContext } from "../..";
import { useGroupChatShortStore } from "@/store/group-chat-new";
import { useUser } from "@/store";
import { useToast } from "@/hooks";

function copyImage(message: Message) {
  // 创建一个img的dom，用来承载图片
  // 创建 img 元素并设置 src 属性
  const messagebox = document.getElementById(message.clientMsgNo);
  let tempImg;
  if (messagebox) {
    tempImg = messagebox.querySelector(`.msgcard-img`);
  }

  // 将 div 添加到 document

  if (tempImg) {
    // 选择 div 中的内容
    const range = document.createRange();
    range.selectNode(tempImg);
    window.getSelection().removeAllRanges(); // 清除现有的选择
    window.getSelection().addRange(range);

    // 执行复制命令
    document.execCommand("copy");

    // 清理选择和临时元素
    window.getSelection().removeAllRanges();
  }
}

const MsgCard = (props: { data: Message; children: string | ReactNode }) => {
  const { data } = props;
  const subscribers = useGroupChatShortStore((state) => state.subscribers);
  const { user } = useUser();
  const { toast } = useToast();
  //  获取撤回权限
  const getRevokePremession = () => {
    if (subscribers && subscribers.length > 0) {
      const self = subscribers.find((item) => item.uid === user?.username);
      if (self && self.orgData.type !== "0") {
        return true;
      }
    }

    if (data.fromUID === user?.username) {
      return true;
    }

    return false;
  };

  const { handleReply, handleRevoke } = useContext(GroupChatContext);
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
                typeof handleReply === "function" &&
                  handleReply({ message: data, isQuote: true });
              }}
            >
              引用
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                typeof handleReply === "function" &&
                  handleReply({ message: data });
              }}
            >
              回复
            </ContextMenuItem>
            {getRevokePremession() === true && (
              <ContextMenuItem
                onClick={() => {
                  typeof handleRevoke === "function" && handleRevoke(data);
                }}
              >
                撤回
              </ContextMenuItem>
            )}
            <ContextMenuItem
              onClick={() => {
                if (data.content instanceof MessageText && data.content.text) {
                  copy(data.content.text);
                  toast({ description: "复制成功" });
                } else if (
                  data.content instanceof MessageImage &&
                  data.content.remoteUrl
                ) {
                  copyImage(data);
                  toast({ description: "复制成功" });
                }
              }}
            >
              复制
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
