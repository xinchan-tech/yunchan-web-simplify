import { Button, JknTable, type JknTableProps } from "@/components";
import { useQuery } from "@tanstack/react-query";
import {
  CreateGroupRecord,
  getCreateGroupHistoryService,
} from "@/api/group-chat";
import { useModal } from "@/components";
import { useState } from "react";
import CreateGroupForm from "./create-group-form";
// import { getGroupDetailService } from "@/api/group-chat";

const statusData: Record<string, { text: string; color: string }> = {
  "0": {
    text: "审核中",
    color: "yellow",
  },
  "1": {
    text: "已通过",
    color: "green",
  },
  "2": {
    text: "不通过",
    color: "red",
  },
};

const CreateHistory = (props: {
  onReCreate?: (record: CreateGroupRecord) => void;
}) => {
  const options = {
    queryKey: [getCreateGroupHistoryService.key],
    queryFn: () => getCreateGroupHistoryService(),
  };
  const { data } = useQuery(options);
  const [curRecord, setCurRecord] = useState<CreateGroupRecord | null>(null);

  const viewDetailModal = useModal({
    content: (
      <div>
        <div className="flex p-4 h-[200px] items-center justify-center">
          {curRecord?.status === "2" &&
            `申请被驳回, 驳回原因: ${curRecord?.reject_reason}`}
          {curRecord?.status === "1" && `已经创建社群`}
          {curRecord?.status === "0" && `正在审核中`}
        </div>
        <div className="mt-2 flex justify-center pb-2">
          <Button
            className="inline-block"
            size={"sm"}
            onClick={() => {
              viewDetailModal.modal.close();
            }}
          >
            确定
          </Button>
        </div>
      </div>
    ),
    footer: false,
    title: "审核详情",
    closeIcon: false,
    className: "w-[300px]",
  });

  const columns: JknTableProps<CreateGroupRecord>["columns"] = [
    {
      header: "序号",
      accessorKey: "index",
      enableSorting: false,
      cell: ({ row }) => <span className="block py-1">{row.index + 1}</span>,
      meta: { align: "center", width: 40 },
    },
    {
      header: "社群名称",
      accessorKey: "name",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="block py-1">{row.original.name || ""}</span>
      ),
      meta: { align: "center", width: 250 },
    },
    {
      header: "社群价格",
      accessorKey: "price",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="block py-1">${row.original.price || "0"}</span>
      ),
      meta: { align: "center" },
    },
    {
      header: "人数上限",
      accessorKey: "max_num",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="block py-1">{row.original.max_num || "0"}</span>
      ),
      meta: { align: "center" },
    },
    {
      header: "审核状态",
      accessorKey: "status",
      enableSorting: false,
      cell: ({ row }) => (
        <span
          className="block py-1"
          style={{ color: statusData[row.original.status].color }}
        >
          {statusData[row.original.status].text || "--"}
        </span>
      ),
      meta: { align: "center" },
    },
    {
      header: "操作",
      accessorKey: "account",
      enableSorting: false,
      cell: ({ row }) => {
        return (
          <>
            <span
              className="py-1 mr-1 cursor-pointer text-primary"
              onClick={() => {
                setCurRecord(row.original);
                viewDetailModal.modal.open();
              }}
            >
              详情
            </span>
            {row.original.status === "2" && (
              <span
                onClick={() => {
                  typeof props.onReCreate === "function" &&
                    props.onReCreate(row.original);
                }}
                className="block py-1 cursor-pointer text-primary"
              >
                修改
              </span>
            )}
          </>
        );
      },
      meta: { align: "center" },
    },
  ];
  return (
    <div className="h-full overflow-hidden">
      <JknTable rowKey="code" data={data?.items || []} columns={columns} />
      {viewDetailModal.context}
    </div>
  );
};

export default CreateHistory;
