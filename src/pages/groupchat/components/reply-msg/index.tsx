import { cn } from "@/utils/style";
import { Message, MessageImage, MessageText } from "wukongimjssdk";

const ReplyMsg = (props: {
  message: Message;
  locateMessage: (messageSeq: number) => void;
}) => {
  const { message, locateMessage } = props;
  const renderReplyContent = () => {
    if(message.content.reply.content instanceof MessageText) {
      return message.content.reply.content?.conversationDigest
    } else if(message.content.reply.content instanceof MessageImage) {
      return <img src={message.content.reply.content.remoteUrl} className='max-h-[80px] max-w-[100px]'/>
    }
  }
  return (
    <div className={cn("flex mb-6 pl-14 pr-14", message.send && "justify-end")}>
      <div
        className="reply-msg p-4 rounded-md inline-block"
        onClick={() => {
          typeof locateMessage === "function" &&
            locateMessage(message?.content.reply.messageSeq);
        }}
      >
        {message.content.reply.revoke === true ? (
          "消息已撤回"
        ) : (
          <>
            <div className="mb-1"> {message.content.reply.fromName}： </div>
            <div> {renderReplyContent()}</div>
          </>
        )}

        <style jsx>
          {`
            .reply-msg {
              font-size: 14px;
              background-color: rgb(53, 54, 55);
              color: rgb(126, 131, 138);
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default ReplyMsg;
