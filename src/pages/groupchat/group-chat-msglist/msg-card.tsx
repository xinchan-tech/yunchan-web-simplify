import { cn } from "@/utils/style";
import { Message, MessageText } from "wukongimjssdk";
import MsgHead from "../components/msg-head";

const getMessageText = (m: Message) => {
  if (m instanceof Message) {
    const streams = m.streams;
    let text = "";
    if (m.content instanceof MessageText) {
      const messageText = m.content as MessageText;
      text = messageText.text || "";
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

const MsgCard = (props: { data: Message }) => {
  const { data } = props;

  return (
    <div
      key={data.clientMsgNo}
      className={cn("flex mb-6", data.send && "justify-end")}
    >
      {data.send !== true && (
        <div className="w-12 h-12 rounded-md  left">
          <img
            className="w-12 h-12 rounded-md"
            src={`https://api.multiavatar.com/${data.fromUID}.png`}
          />
          <MsgHead message={data} />
        </div>
      )}

      <div
        className={cn(
          "bubble h-10 leading-10 rounded-lg relative",
          data.send && "right-bubble"
        )}
      >
        <span>{getMessageText(data)}</span>
      </div>

      {data.send === true && (
        <div className="w-12 h-12 rounded-md  right">
          <img
            className="w-12 h-12 rounded-md"
            src={`https://api.multiavatar.com/${data.fromUID}.png`}
          />
          <MsgHead message={data} />
        </div>
      )}
      <style>
        {`
            
                .sedn-card {

                }
                .bubble {
                    background-color: rgb(65, 65, 65);
                    color: #fff;
                    padding: 0 12px;
                    margin-left: 10px;
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
