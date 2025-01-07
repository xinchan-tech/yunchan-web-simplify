import { Resizable } from "re-resizable";
import { useRef } from "react";
import { useGroupChatStoreNew } from "@/store/group-chat-new";
import { Textarea, Button } from "@/components";
import WKSDK, { MessageText, Setting } from "wukongimjssdk";

const GroupChatInput = (props: { onMsgSend: () => void }) => {
  const { bottomHeight, setBottomHeight, toChannel } = useGroupChatStoreNew();
  const lastBottomHeighti = useRef(185);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const { onMsgSend } = props;

  const handleSend = () => {
    let value = messageRef.current?.value;
    if (value?.trim() === "") {
      return;
    }
    const setting = Setting.fromUint8(0);
    const content = new MessageText(value);
    if (toChannel) {
      WKSDK.shared().chatManager.send(content, toChannel, setting);
      if (messageRef.current) {
        messageRef.current.value = "";
      }

      if (typeof onMsgSend === "function") {
        onMsgSend();
      }
    }
  };
  return (
    <Resizable
      defaultSize={{ height: bottomHeight + "px" }}
      onResize={(e, direction, ref, delta) => {
        const res = delta.height + lastBottomHeighti.current;

        setBottomHeight(res);
      }}
      onResizeStop={() => {
        lastBottomHeighti.current = bottomHeight;
      }}
      enable={{
        top: true,
      }}
      maxHeight={400}
    >
      <div style={{ height: bottomHeight + "px" }}>
        <div className="h-[40px]"></div>
        <div
          style={{
            height: "calc(100% - 40px)",
          }}
        >
          <Textarea ref={messageRef} onKeyDown={(e) => {
            if(e.key === 'Enter') {
              handleSend()
            }
          }} />
          <Button onClick={handleSend}>发送</Button>
        </div>
      </div>
    </Resizable>
  );
};

export default GroupChatInput;
