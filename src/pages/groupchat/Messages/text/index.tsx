import MsgCard from "../../components/msg-card";

import WKSDK, {
  Channel,
  ChannelTypePerson,
  Message,
  MessageText,
} from "wukongimjssdk";
import { MessageWrap, PartType, Part } from "../../Service/Model";
import { cn } from "@/utils/style";

export const getRevokeText = (fromUID: string) => {
  const fromUser = WKSDK.shared().channelManager.getChannelInfo(
    new Channel(fromUID, ChannelTypePerson)
  );

  return (
    <div className='message-system'>
      {fromUser?.title + "撤回了一条消息"}
      <style jsx>{`
        .message-system {
          margin: 20px auto;
          color: rgb(90, 90, 90);
          font-size: 12px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

const TextCell = (props: { message: Message; messageWrap?: MessageWrap }) => {
  const { message, messageWrap } = props;

  const parts = messageWrap?.parts;
  const elements = new Array<JSX.Element>();

  const getCommonText = (k: number, part: Part) => {
    const texts = part.text.split("\n");

    return (
      <span
        key={`${message.clientMsgNo}-text-${k}`}
        className="message-text-commontext"
      >
        {texts.map((text, i) => {
          return (
            <span
              key={`${message.clientMsgNo}-common-${i}`}
              className="message-text-richtext"
            >
              {text}
              {i !== texts.length - 1 ? <br /> : undefined}
            </span>
          );
        })}
      </span>
    );
  };

  const getMentionText = (k: number, part: Part) => {
    // console.log(part, 'partpart')
    let latestName: any = part.text;
    // if(part.data?.uid) {
    //   latestName = '@' + WKSDK.shared().channelManager.getChannelInfo(
    //     new Channel(part.data.uid, ChannelTypePerson)
    //   )?.title;
    // }

    return (
      <span
        key={`${message.clientMsgNo}-mention-${k}`}
        className={cn(
          "message-text-richmention",
          message.send ? "message-text-send" : "message-text-recv"
        )}
      >
        {latestName}
      </span>
    );
  };
  if (parts && parts.length > 0) {
    let i = 0;
    for (const part of parts) {
      part.text.split("\n");
      if (part.type === PartType.text) {
        elements.push(getCommonText(i, part));
      } else if (part.type === PartType.mention) {
        elements.push(getMentionText(i, part));
      }
      // todo 后面写
      // else if (part.type === PartType.emoji) {
      //   elements.push(this.getEmojiText(i, part));
      // } else if (part.type === PartType.link) {
      //   elements.push(this.getLinkText(i, part));
      // }
      i++;
    }
  }

  return (
    <>
      {message.content.revoke === true ? (
        getRevokeText(message.content.revoker)
      ) : (
        <MsgCard data={message}>{elements}</MsgCard>
      )}
      <style>
        {`
          .message-text-richmention {
            color: rgb(65,158,255)
          }
          
        `}
      </style>
    </>
  );
};

export default TextCell;
