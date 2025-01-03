import JknIcon from "../jkn/jkn-icon";
import useGroupChatStore from "@/store/group-chat";
import { Resizable } from "re-resizable";
import { useRef } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { useBoolean } from "ahooks";
import JoinGroupModal from "./group-oper-modal/join-group-modal";
import { useModal } from "../modal";

const ImChatBottom = () => {
  const [openJoinGroup, { toggle }] = useBoolean(false);
  const lastBottomHeighti = useRef(300);
  const bottomHeight = useGroupChatStore((state) => state.bottomHeight);
  const setBottomHeight = useGroupChatStore((state) => state.setBottomHeight);

  const _onOpenChange = (open?: boolean) => {
    if (!open) {
      toggle();
    }
  };

  const createGroup = useModal({
    content:<span>这是创建群组</span>,
    footer: null,
    onOpen: () => { },
    title: '创建群组',
    closeIcon: true
  })

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
              <div className="h-[34px] flex items-center justify-center jianqun" onClick={() => {
                createGroup.modal.open()
              }}>
                创建社群
              </div>
              <div className="h-[34px] flex items-center justify-center jianqun" onClick={() => {
                toggle();
              }}>
                加入群聊
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {
            openJoinGroup &&   <JoinGroupModal open={openJoinGroup} onOpenChange={_onOpenChange} />
        }

        {
            createGroup.context
        }
      
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
