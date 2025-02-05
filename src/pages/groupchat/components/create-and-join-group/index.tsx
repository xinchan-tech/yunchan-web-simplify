import { applyCreateGroupService, createGroupRequest } from "@/api";

import {
  useModal,
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormItem,
  JknIcon,
  Select,
  Input,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Textarea,
  Checkbox,
  ScrollArea,
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
import { useToast, useZForm } from "@/hooks";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import AliyunOssUploader from "../aliyun-oss-uploader";
import CreateHistory from "./create-history";
import JoinGroupContent from "./join-group-content";

const memberLimitConf = [
  "50",
  "100",
  "200",
  "500",
  "1000",
  "2000",
  "3000",
  "4000",
  "5000",
];

const priceConf = [
  "0.0",
  "9.9",
  "19.9",
  "29.9",
  "39.9",
  "49.9",
  "59.9",
  "69.9",
  "79.9",
  "89.9",
  "999.9",
];

const priceTagSchema = z.object({
  unit: z.string(),
  price: z.string(),
});

const createGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: "群名称必填" }),
  grade: z.string().min(1, { message: "请选择社群等级" }),
  brief: z.string().min(1, { message: "群简介必填" }).max(500),
  notice: z.string().min(1, { message: "群公告必填" }).max(500),
  max_num: z.string().min(1, { message: "请选择社群人数上限" }),
  avatar: z.string(),
  tags: z.string(),
  price_tag_year: z.string().optional(),
  price_tag_month: z.string().optional(),
});

type CreateGroupForm = z.infer<typeof createGroupSchema>;

const CreateGroup = () => {
  const { toast } = useToast();
  const form = useZForm(createGroupSchema, {
    id: "",
    name: "",
    grade: "0",
    brief: "",
    max_num: "50",
    notice: "",
    avatar: "",
    tags: "",
    price_tag_year: "0.0",
    price_tag_month: "0.0",
  });

  const [agree, setAgree] = useState(false);

  const createGroupMutation = useMutation({
    mutationFn: (params: CreateGroupForm) => {
      const goodParams: createGroupRequest = {
        id: params.id,
        name: params.name,
        grade: params.grade,
        brief: params.brief,
        avatar: params.avatar,
        notice: params.notice,
        max_num: params.max_num,
        tags: params.tags,
        price_tag: [
          {
            unit: "月",
            price: params.price_tag_month || "0.0",
          },
          {
            unit: "年",
            price: params.price_tag_year || "0.0",
          },
        ],
      };
      return applyCreateGroupService(goodParams);
    },
    onSuccess: (res) => {
      if (res.status === 1) {
        toast({ description: "提交成功，请等待审核" });
        createGroup.modal.close();
      }
    },
    onError: (err) => {
      toast({
        description: err.message,
      });
    },
  });

  const viewAgreement = useModal({
    content: (
      <div className="pl-[50px] pr-[50px] pt-4 pb-10">
        <ScrollArea className="h-[450px] agreement-scroll-box"></ScrollArea>
        <style>
          {`
            .agreement-scroll-box {
              border: 1px solid rgb(66, 66, 66);
              border-radius: 8px;
            }
          `}
        </style>
      </div>
    ),
    className: "w-[720px]",
    footer: null,
    title: "社群服务协议",
    closeIcon: true,
  });

  const createGroup = useModal({
    content: (
      <div className="p-8 ">
        <div
          className="text-right mb-4 text-xs text-gray-400 "
          onClick={() => {
            applyRecord.modal.open();
          }}
        >
          申请记录
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(createGroupMutation.mutate as any)}>
            <div className="flex">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex flex-1 items-center ">
                    <FormLabel className="w-[90px] text-right mr-2">
                      社群名称：
                    </FormLabel>
                    <FormControl
                      className={
                        "border-dialog-border rounded-sm  bg-accent inline-block"
                      }
                    >
                      <Input
                        className="border-none placeholder:text-tertiary flex-1"
                        style={{ marginTop: "0" }}
                        placeholder="请输入内容"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem className="flex flex-1 items-center ">
                    <FormLabel className="w-[90px] text-right mr-2">
                      社群头像：
                    </FormLabel>
                    <FormControl>
                      <AliyunOssUploader
                        onChange={field.onChange}
                      ></AliyunOssUploader>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex mt-6">
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem className="flex flex-1 items-center">
                    <FormLabel className="w-[90px] text-right mr-2">
                      社群标签：
                    </FormLabel>
                    <FormControl
                      className={
                        "border-dialog-border rounded-sm  bg-accent inline-block"
                      }
                    >
                      <Input
                        className="border-none placeholder:text-tertiary flex-1"
                        style={{ marginTop: "0" }}
                        placeholder="请输标签，使用逗号进行分隔"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex mt-6">
              <FormField
                control={form.control}
                name="grade"
                // defaultValue="0"
                render={({ field }) => (
                  <FormItem className="flex flex-1 items-center">
                    <FormLabel className="w-[90px] text-right mr-2">
                      付费等级：
                    </FormLabel>
                    <FormControl
                      className={
                        "border-dialog-border rounded-sm  bg-accent inline-block"
                      }
                    >
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger
                          style={{ marginTop: "0" }}
                          className="flex-1 bg-accent"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">初级</SelectItem>
                          <SelectItem value="1">中级</SelectItem>
                          <SelectItem value="2">高级</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_num"
                render={({ field }) => (
                  <FormItem className="flex flex-1 items-center">
                    <FormLabel className="w-[90px] text-right mr-2">
                      会员上限：
                    </FormLabel>
                    <FormControl
                      className={
                        "border-dialog-border rounded-sm  bg-accent inline-block"
                      }
                    >
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger
                          style={{ marginTop: "0" }}
                          className="flex-1 bg-accent"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {memberLimitConf.map((limit) => (
                            <SelectItem key={limit} value={limit}>
                              {limit}人
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex flex-1 items-center">
                <div className="w-[90px] text-right mr-2 text-sm">价格：</div>
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name="price_tag_year"
                    render={({ field }) => (
                      <FormItem className="flex items-center">
                        <FormControl
                          className={
                            "border-dialog-border rounded-sm  bg-accent inline-block"
                          }
                        >
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger
                              style={{ marginTop: "0" }}
                              className="flex-1 bg-accent"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {priceConf.map((limit) => (
                                <SelectItem key={limit} value={limit}>
                                  ${limit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <span className="ml-2 text-sm">/年</span>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price_tag_month"
                    render={({ field }) => (
                      <FormItem className="mt-2 flex items-center">
                        <FormControl
                          className={
                            "border-dialog-border rounded-sm mt- bg-accent inline-block"
                          }
                        >
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger
                              style={{ marginTop: "0" }}
                              className="flex-1 bg-accent"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {priceConf.map((limit) => (
                                <SelectItem key={limit} value={limit}>
                                  ${limit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <span className="ml-2 text-sm">/月</span>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            <div className="flex mt-6">
              <FormField
                control={form.control}
                name="brief"
                render={({ field }) => (
                  <FormItem className="flex flex-1 items-center">
                    <FormLabel className="w-[90px] text-right mr-2">
                      社群简介：
                    </FormLabel>
                    <FormControl
                      className={
                        "border-dialog-border rounded-sm  bg-accent inline-block"
                      }
                    >
                      <Textarea
                        className="border-none placeholder:text-tertiary flex-1"
                        style={{ marginTop: "0", resize: "none" }}
                        placeholder="请输入内容"
                        maxLength={500}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex mt-6">
              <FormField
                control={form.control}
                name="notice"
                render={({ field }) => (
                  <FormItem className="flex flex-1 items-center">
                    <FormLabel className="w-[90px] text-right mr-2">
                      社群公告：
                    </FormLabel>
                    <FormControl
                      className={
                        "border-dialog-border rounded-sm  bg-accent inline-block"
                      }
                    >
                      <Textarea
                        className="border-none placeholder:text-tertiary flex-1"
                        style={{ marginTop: "0", resize: "none" }}
                        placeholder="请输入内容"
                        maxLength={500}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex mt-6 items-center">
              <Checkbox
                checked={agree}
                onCheckedChange={(checked: boolean) => {
                  setAgree(checked);
                }}
              />
              <span className="ml-2 text-sm">
                我已经认真阅读并同意
                <span
                  className="text-primary cursor-pointer"
                  onClick={() => {
                    // viewAgreement.modal.open();
                  }}
                >
                  《社群服务协议》
                </span>
              </span>
            </div>
            <div className="flex justify-center mt-6">
              <Button
                loading={createGroupMutation.isPending}
                onClick={(e) => {
                  if (!agree) {
                    toast({
                      description: "请先阅读并同意社群服务协议",
                    });
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                }}
              >
                提交申请
              </Button>
            </div>
          </form>
        </Form>
      </div>
    ),
    footer: null,
    className: "w-[720px]",
    onOpen: () => {},
    title: "创建社群",
    closeIcon: true,
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
    title: "创建群组",
    closeIcon: true,
  });

  // 申请记录
  const applyRecord = useModal({
    className: "w-[720px]",
    title: "创建记录",
    closeIcon: true,
    footer: null,
    content: <CreateHistory key="创建记录" />,
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
      {viewAgreement.context}
      {applyRecord.context}
      {joinGroup.context}
    </>
  );
};

export default CreateGroup;
