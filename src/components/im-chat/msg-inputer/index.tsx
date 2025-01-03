import { Input } from "../../ui/input";
import JknIcon from "../../jkn/jkn-icon";
import {
  Popover,

  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useState } from "react";


const MsgInputer = () => {
 
    const [inputMsg, setInputMsg] = useState("");

  return (
    <div className="pr-2 pl-2 sender-bar flex items-center bg-background">
      <div
        className={"border-dialog-border rounded-sm  bg-accent inline-block"}
        style={{
          height: "22px",
          width: "100%",
        }}
      >
        <Input
          className="border-none placeholder:text-tertiary"
          placeholder="输入你的想法，一起讨论！"
          style={{ lineHeight: "22px", height: "22px" }}
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          size={"sm"}
        />
      </div>
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
          <Picker theme="dark" previewPosition="none" searchPosition="none" data={data} onEmojiSelect={(emoji, event) => {
            event.stopPropagation();
            const msg = `${inputMsg}${emoji.native}`;
            console.log(msg)
            setInputMsg(msg)
          }} />
        </PopoverContent>
      </Popover>

      <JknIcon name="pick_image" className="ml-2" />
      <style jsx>
        {`
          .sender-bar {
            position: absolute;
            bottom: 0;
            width: 100%;
            box-sizing: border-box;
            border-top: 1px solid hsl(var(--border));
            height: 34px;
          }
        `}
      </style>
    </div>
  );
};

export default MsgInputer;
