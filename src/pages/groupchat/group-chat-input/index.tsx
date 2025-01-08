import { Resizable } from "re-resizable";
import { useRef } from "react";
import { useGroupChatStoreNew } from "@/store/group-chat-new";
import { Textarea, Button } from "@/components";
import WKSDK, { MessageText, Setting } from "wukongimjssdk";
import { JknIcon } from "@/components";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

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

  const onFileClick = (event: any) => {
    event.target.value = ""; // 防止选中一个文件取消后不能再选中同一个文件
  };
  const onFileChange = () => {
    // let file = this.$fileInput.files[0];
    // this.showFile(file);
  };
  const imgUploadRef = useRef<HTMLInputElement>();
  const chooseFile = () => {
    imgUploadRef.current && imgUploadRef.current.click()
  }
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
      <div style={{ height: bottomHeight + "px" }} className="chat-msg-inputer">
        <div className="h-[40px] flex items-center">
          <Popover>
            <PopoverTrigger asChild>
              <span>
                <JknIcon
                  name="smile"
                  // onClick={setTrue}
                  className="ml-2"
                />
              </span>
            </PopoverTrigger>
            <PopoverContent side="bottom" className="w-[355px]">
              <Picker
                theme="dark"
                previewPosition="none"
                searchPosition="none"
                data={data}
                onEmojiSelect={(emoji, event) => {
                  if (messageRef.current) {
                    event.stopPropagation();
                    const prevVal = messageRef.current.value;
                    const msg = `${prevVal}${emoji.native}`;

                    messageRef.current.value = msg;
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          <span onClick={chooseFile}>
            <input
              onClick={onFileClick}
              onChange={onFileChange}
            
              type="file"
              multiple={false}
              accept="image/*"
              ref={imgUploadRef}
              style={{ display: "none" }}
            />
            <JknIcon name="pick_image" className="ml-2" />
          </span>
        </div>
        <div
          style={{
            height: "calc(100% - 40px)",
          }}
        >
          <Textarea
            ref={messageRef}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend}>发送</Button>
        </div>
      </div>
      <style jsx>
        {`
           {
            .chat-msg-inputer {
              border-top: 1px solid rgb(50, 50, 50);
            }
            .fake-border {
              height: 1px;
              background-color: rgb(50, 50, 50);
            }
            .fake-border:hover {
              height: 3px;
              background-color: rgb(84, 88, 168);
            }
          }
        `}
      </style>
    </Resizable>
  );
};

export default GroupChatInput;
