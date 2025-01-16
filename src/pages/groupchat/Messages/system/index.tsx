import WKSDK, { Channel, ChannelTypePerson, Message } from "wukongimjssdk";
const SystemCell = (props: { message: Message }) => {
  const { message } = props;

  if (message.content.cmd === "messageRevoke") {
    return "";
  }

  if (message.content.cmd === "channelUpdate") {
    const userInfo = WKSDK.shared().channelManager.getChannelInfo(
      new Channel(message.fromUID, ChannelTypePerson)
    );
    if (userInfo) {
      return (
        <div className="message-system">
          {userInfo.title}加入了群聊
          <style jsx>
            {`
              .message-system {
                margin: 20px auto;
                color: rgb(90, 90, 90);
                font-size: 12px;
                text-align: center;
              }
            `}
          </style>
        </div>
      );
    }
  }

  return (
    <div className="message-system">
      {message.content.displayText}
      <style jsx>
        {`
          .message-system {
            margin: 20px auto;
            color: rgb(90, 90, 90);
            font-size: 12px;
            text-align: center;
          }
        `}
      </style>
    </div>
  );
};

export default SystemCell;
