
export type MsgCardProps = {
  /**
   * 消息内容
   */
  msg: string;
  /**
   * 消息类型
   */
  type: "text" | "image" | "audio" | "video";
  /**
   * 发送时间
   */
  time: string;
  /**
   * 发送者
   */
  sender: {
    avatar: string;
    name: string;
  };
  /**
   * 接收者
   */
  receiver: string;
};

const MsgCard = (props: MsgCardProps) => {
  return (
    <div className="flex msg-card">
      <div className="h-6 w-6 msg-avatar">
        {/* <img src={props.sender.avatar } alt="" /> */}
        <div className="h-6 w-6 msg-avatar bg-slate-200"></div>
      </div>
      <div className='ml-1'>
        <div className="text-sm text-gray-400">
            <span className="mr-1">

                {props.sender.name}
            </span>
            <span>
                {props.time}
            </span>
        </div>
        <div>{props.msg}</div>
      </div>
 
         
      <style jsx>{`
        .msg-avatar {
          border-radius: 50%;
        }
        .msg-card {
          padding: 0.5rem;
          border-bottom: 0.0625rem solid hsl(var(--border));
          &:hover {
            background-color: rgb(39,40,43);
            color: #fff;
          }
        }
      `}</style>
    </div>
  );
};

export default MsgCard;
