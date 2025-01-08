import MsgCard from "../../components/msg-card";

import { Message, MessageText } from "wukongimjssdk";
const TextCell = (props: { message: Message }) => {
  const { message } = props;
  return <MsgCard data={message}>{message.content.text}</MsgCard>;
};

export default TextCell;
