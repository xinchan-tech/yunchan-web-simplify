import WKSDK, { Channel, ChannelTypePerson } from "wukongimjssdk";
import { ConversationWrap } from "../ConversationWrap";

export const lastContent = (conversationWrap: ConversationWrap) => {
  if (!conversationWrap.lastMessage) {
    return;
  }
  const draft = conversationWrap.remoteExtra.draft;
  if (draft && draft !== "") {
    return draft;
  }
};
