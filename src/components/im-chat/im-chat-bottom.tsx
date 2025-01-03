import JknIcon from "../jkn/jkn-icon";
import useGroupChatStore from "@/store/group-chat";
import { Resizable } from "re-resizable";
import {  useRef } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";

const ImChatBottom = () => {
  const lastBottomHeighti = useRef(300);
  const bottomHeight = useGroupChatStore((state) => state.bottomHeight);
  const setBottomHeight = useGroupChatStore((state) => state.setBottomHeight);
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
      <div className="im-chat-bottom-container">
        <div className="sperate-line"></div>
        <div className="h-8 leading-8 flex justify-between items-center pl-2 pr-2">
          <div>讨论社群</div>
          <Popover>
            <PopoverTrigger asChild>
                <span>
                    <JknIcon name="add" />
                </span>
            </PopoverTrigger>
            <PopoverContent side="bottom" className="w-[110px]">
                <div className="h-[34px] flex items-center justify-center jianqun">创建社群</div>
                <div className="h-[34px] flex items-center justify-center jianqun">加入群聊</div>
            </PopoverContent>
          </Popover>
         
        </div>
        <div></div>

        <style>
            {`
                .sperate-line {
                    width: 100%;
                    height: 1px;
                    background-color: hsl(var(--border));
                }
                .jianqun {
                    &:hover {
                        background-color: hsl(var(--primary))
                    }
                }
            `}
        </style>
      </div>
    </Resizable>
  );
};

export default ImChatBottom;
