import { JknIcon } from "@/components";
import { useMemo } from "react";
import WKSDK, { Message, Channel, ChannelTypePerson } from "wukongimjssdk";

const ReplyMessageView = (props: { message: Message; onClose: () => void }) => {
  const { message, onClose } = props;

  const fromChannelInfo = useMemo(() => {
    if (message) {
      return WKSDK.shared().channelManager.getChannelInfo(
        new Channel(message.fromUID, ChannelTypePerson)
      );
    }
    return null;
  }, [message]);

  return (
    <div className="absolute items-center reply-message-container w-full box-border flex justify-between">
      <div>
        <div>{fromChannelInfo?.title}</div>
        <div>{message?.content?.conversationDigest}</div>
      </div>
      <JknIcon name='close' />
      <style jsx>
        {`
           {
            .reply-message-container {
              background-color: rgb(65, 64, 64);
              padding: 12px;
              top: 0;
              transform: translateY(-100%);
              color: #fff;
              border-radius: 8px 8px 0 0;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ReplyMessageView;
