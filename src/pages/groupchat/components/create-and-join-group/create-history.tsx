import { JknTable, type JknTableProps } from "@/components";
import { useQuery } from "@tanstack/react-query";
import {
  CreateGroupRecord,
  getCreateGroupHistoryService,
} from "@/api/group-chat";

const statusMap = {
  "0": "审核中",
  "1": "审核通过",
  "2": "审核拒绝",
};

const CreateHistory = () => {
  const options = {
    queryKey: [getCreateGroupHistoryService.key],
    queryFn: () => getCreateGroupHistoryService(),
  };
  const { data } = useQuery(options);

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
        <span className="block py-1">{row.original.price || "0"}</span>
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
        <span className="block py-1">
          {statusMap[row.original.status] || "--"}
        </span>
      ),
      meta: { align: "center" },
    },
    {
      header: "操作",
      accessorKey: "account",
      enableSorting: false,
      cell: () => <span className="block py-1"></span>,
      meta: { align: "center" },
    },
  ];
  return (
    <div className="h-full overflow-hidden">
      <JknTable rowKey="code" data={data?.items || []} columns={columns} />
    </div>
  );
};

export default CreateHistory;
