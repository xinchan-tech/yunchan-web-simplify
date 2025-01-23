import { JknIcon } from "@/components";
import { useMemo } from "react";
import WKSDK, { Message, Channel, ChannelTypePerson } from "wukongimjssdk";
import { useGroupChatShortStore } from "@/store/group-chat-new";

const ReplyMessageView = (props: {
  message?: Message;
  onClose: () => void;
}) => {
  const { message, onClose } = props;

  const { mentions } = useGroupChatShortStore();
  const fromChannelInfo = useMemo(() => {
    let id;
    console.log(mentions, 'mentionsmentionsmentions')
    if (message) {
      id = message.fromUID;
    } else if (mentions && mentions.length > 0) {
      id = mentions[0].uid;
    }
    if (id) {
      return WKSDK.shared().channelManager.getChannelInfo(
        new Channel(id, ChannelTypePerson)
      );
    } else {
      return null;
    }
  }, [message, mentions]);

  return (
    <div className="absolute items-center reply-message-container w-full box-border flex justify-between">
      <div>
        <div className="text-sm text-gray-300">
          {mentions && mentions.length > 0 ? "回复" : "引用"}
          {fromChannelInfo?.title}
        </div>
        {message && (
          <div className="text-xs text-gray-400 mt-2">
            {message.content?.conversationDigest}
          </div>
        )}
      </div>
      <JknIcon
        name="close"
        onClick={() => {
          typeof onClose === "function" && onClose();
        }}
      />
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
