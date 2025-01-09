import { cn } from "@/utils/style";
import WKSDK, { Message, Channel, ChannelTypePerson } from "wukongimjssdk";
import ChatAvatar from "../chat-avatar";
const MsgHead = (props: { message: Message; type: "left" | "right" }) => {
  const { message, type } = props;

  const channelInfo = WKSDK.shared().channelManager.getChannelInfo(
    new Channel(message.fromUID, ChannelTypePerson)
  );
  //   if(!channelInfo) {
  //     WKSDK.shared().channelManager.fetchChannelInfo(fromChannel)
  //   }

  return (
    <div className="relative">
      <div
        className={cn(
          "absolute user-name",
          type === "left" ? "left-name" : "right-name"
        )}
      >
        {channelInfo?.title}
      </div>

      {/* {channelInfo?.logo ? (
        <img className="w-12 h-12 rounded-md" src={channelInfo.logo} />
      ) : (
        <div className="w-12 h-12 rounded-md bg-orange-700 flex items-center text-lg justify-center">
          {channelInfo?.title[0].toLocaleUpperCase()}
        </div>
      )} */}
      <ChatAvatar
        data={{
          name: channelInfo?.title || "",
          avatar: channelInfo?.logo || "",
          uid: channelInfo?.channel.channelID || "",
        }}
        radius="8px"
      />
      <style jsx>
        {`
          .user-name {
            font-size: 12px;
            color: rgb(15, 132, 241);
            min-width: 100px;
            top: 0;
          }
          .left-name {
            left: 58px;
            text-align: left;
          }
          .right-name {
            right: 58px;
            text-align: right;
          }
        `}
      </style>
    </div>
  );
};

export default MsgHead;
