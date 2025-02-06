import {
  useModal,
  JknIcon,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useState } from "react";
import JoinGroupContent from "./join-group-content";
import CreateGroupForm from "./create-group-form";
import { CreateGroupRecord } from "@/api";

const CreateGroup = () => {
  const createGroup = useModal({
    content: (
      <CreateGroupForm
        onSuccess={() => {
          createGroup.modal.close();
        }}
        onReCreate={(data) => {
          reCreateModal.modal.open();
          setCurRecord(data);
        }}
      />
    ),
    footer: null,
    className: "w-[720px]",
    onOpen: () => {},
    title: "创建社群",
    closeIcon: true,
  });
  const [curRecord, setCurRecord] = useState<CreateGroupRecord | null>(null);
  const reCreateModal = useModal({
    content: (
      <CreateGroupForm
        onSuccess={() => {
          reCreateModal.modal.close();
          createGroup.modal.close();
        }}
        editMode
        initData={curRecord}
      ></CreateGroupForm>
    ),
    className: "w-[720px]",
    title: "重新申请",
    closeIcon: true,
    footer: null,
  });

  const joinGroup = useModal({
    content: (
      <JoinGroupContent
        onSuccess={() => {
          joinGroup.modal.close();
        }}
      />
    ),
    footer: null,
    className: "w-[800px]",
    onOpen: () => {},
    title: "加入群组",
    closeIcon: true,
  });

  const [open, setOpen] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <JknIcon
                      name="add"
                      onClick={() => {
                        setOpen(!open);
                      }}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>加入/创建社群</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => {
              createGroup.modal.open();
              setOpen(false);
            }}
          >
            创建社群
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              joinGroup.modal.open();
              setOpen(false);
            }}
          >
            加入社群
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {createGroup.context}
      {reCreateModal.context}
      {joinGroup.context}
    </>
  );
};

export default CreateGroup;
