
import  { Message } from "wukongimjssdk";
const SystemCell = (props: { message: Message }) => {
  const { message } = props;

  if(message.content.cmd === 'messageRevoke') {
    return ''
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
