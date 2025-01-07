import WKSDK, { Message, Channel, ChannelTypePerson } from "wukongimjssdk";
const MsgHead = (props: { message: Message }) => {
  const { message } = props;

  const channelInfo = WKSDK.shared().channelManager.getChannelInfo(
    new Channel(message.fromUID, ChannelTypePerson)
  );
//   if(!channelInfo) {
//     WKSDK.shared().channelManager.fetchChannelInfo(fromChannel)
//   }

 

  return <span>{channelInfo?.title}</span>;
};

export default MsgHead;
