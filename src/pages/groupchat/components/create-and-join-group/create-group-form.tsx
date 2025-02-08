import {
  applyCreateGroupService,
  CreateGroupRecord,
  createGroupRequest,
} from "@/api";
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormItem,
  Button,
  Checkbox,
  Textarea,
  Select,
  Input,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useModal,
  ScrollArea,
} from "@/components";
import { useZForm, useToast } from "@/hooks";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import AliyunOssUploader from "../aliyun-oss-uploader";
import CreateHistory from "./create-history";
import { useEffect, useState } from "react";

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

const CreateGroupForm = (props: {
  onSuccess: () => void;
  editMode?: boolean;
  initData?: CreateGroupRecord | null;
  onReCreate?: (record: CreateGroupRecord) => void;
}) => {
  const { toast } = useToast();
  const { initData } = props;

  const form = useZForm(createGroupSchema, {
    id: initData?.id || "",
    name: initData?.name || "",
    grade: initData?.grade || "0",
    brief: initData?.brief || "",
    max_num: initData?.max_num || "50",
    notice: initData?.max_num || "",
    avatar: initData?.avatar || "",
    tags: initData?.tags || "",
    price_tag_year: "0.0",
    price_tag_month: "0.0",
  });
  const [agree, setAgree] = useState(false);
  const createGroupMutation = useMutation({
    mutationFn: (params: CreateGroupForm) => {
      const goodParams: createGroupRequest = {
        id: initData ? initData.id : params.id,
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
        typeof props.onSuccess === "function" && props.onSuccess();
      }
    },
    onError: (err) => {
      toast({
        description: err.message,
      });
    },
  });

  useEffect(() => {
    if (initData?.price_tag) {
      try {
        const data = JSON.parse(initData.price_tag);
        // todo find
        const monprice = data.find((item: any) => item.unit === "月");
        const yearprice = data.find((item: any) => item.unit === "年");
        form.setValue("price_tag_year", monprice.price);
        form.setValue("price_tag_month", yearprice.price);
      } catch (err) {}
    }
  }, [initData]);

  const viewAgreement = useModal({
    content: (
      <div className="pl-[50px] pr-[50px] pt-4 pb-10">
        <ScrollArea className="h-[450px] agreement-scroll-box p-4">
          在使用本软件前，请仔细阅读以下文字。风险提示:市场有风险，投资需谨慎
          <br /> <br />
          风险提示
          <br /> <br />
          一:用户应充分认识到证券投资的风险，公司所提供的所有数据与信息，仅供用户参考使用，不构成用户进行投资操作的直接依据、意见或建议等等，用户据此操作，风险自担，公司不承担任何经济与法律责任。
          <br /> <br />
          二:公司通过软件产品为用户提供财经金融资讯和行情数据信息，并通过相关数据分析系统、缠论运算模型等对上述资讯和数据进行整理加工和集成，为用户提供高附加值的信息和数据服务，以利于用户在投资过程中理性决策、控制风险。用户在使用软件产品过程中，对于公司提供的数据信息内容，用户不应将其视作公司明示、默示的承诺证券、期货的投资投收益，不应将其视为具体证券品种选择买卖时机的建议，或任何其他形式的证券投资咨询/建议/意见等。公司对用户的投资决策可能带来的风险或损失不承担任何违约、赔偿或其他民事责任。
          <br /> <br />
          三:证券市场具有较大的风险，请您注意。
          <br /> <br />
          四:本公司相关服务及产品仅是投资辅助工具，单一业绩不代表全面业绩，过往业绩不代表将来业绩，无法保证投资不受损失。
          <br /> <br />
          五:本公司禁止对服务能力和过往业绩进行虚假、不实、误导性的营销宣传，禁止以任何方式承诺或保证投资收益。
          <br /> <br />
          六:本公司不提供代客理财、证券投资咨询服务
          <br /> <br />
          本声明在网站相关页面发布，本公司郑重提示:任何机构或者个人进入本网站，即被视为完全知悉理解并接受本声明的全部内容。本公司保留对声明的修改、解释权。
          <br /> <br />
          使用条款
          <br /> <br />
          下面是您与深圳前海嘉可能信息科技有限公司(简称“嘉可能”)之间法律协议的条款。访问、浏览或使用嘉可能云缠量化大师(简称站点)，您即承认您已阅读、理解并且同意受这些条款的约束，并尊重所有适用的法律和法规。如果您不同意这些条款，请不要使用此站点。嘉可能可随时通过更新此帖子来修改这些“使用条款”以及此站点中包含的任何其他信息，而无需通知您。嘉可能还可以随时对此站点中描述的服务或程序中进行修改或更改，而无需另行通知。
          <br /> <br />
          总则
          <br /> <br />
          此站点包含所有权声明和版权信息，您必须遵守并服从所有相关的条款。相关信息，请参阅标题为“版权和商标信息”的标签。
          未经嘉可能事先的书面同意，不得复印、复制、再次公布、上载、张贴、传播、分发或使用此站点及其中的所有内容创作演绎作品，除非嘉可能授予您一份非专属的、不可转让的且有限的许可，允许您仅在您的计算机上为了您个人使用而非商业性使用此站点的目的访问和显示此站点内的
          Web
          页面。此许可权的条件是:您不修改此站点上显示的内容，完整地保留所有的版权、商标和其他专有权声明并且您接受该内容随附的任何条款、条件和声明，及此站点中的所有其他规定。尽管有上述规定，可从此站点下载、访问或进行其他使用的任何软件和其他资料须受各自的许可条款、条件和声明的管辖。
          如果您未遵守此站点上的条款、条件和声明，则授予您的任何权利将自动终止，而无需事先通知，并且您必须立即销毁您所拥有或掌握的所有已下载资料副本。除了前段中的有限许可权，嘉可能不授予您关于任何专利、商标、版权或其他专有权或知识产权的任何明示的或暗含的权利或许可。您不得在另一个站点或任何其他介质中设置此站点任何内容的镜像。
          <br /> <br />
          特定免责条款
          <br /> <br />
          此站点上的信息不附带任何有关正确性、预判性、最新性及完整性的承诺和保证，并且此站点可能包含有技术方面不够准确的地方或印刷/排字错误。嘉可能不承担以下责任(且明确声明免除以下责H):更新此站点使信息保持最新或者确保任何已张贴信息的准确性或完整性。因此，关于此站点中描述的任何服务、产品或其他事项作出任何决策之前，您应该确认所有已张贴信息的准确性和完整性。
          嘉可能 不保证任何被告知/报告的问题将由 嘉可能 解决，即使
          嘉可能选择为了解决某个问题提供信息，也是如此。
          <br /> <br />
          第三方链接 <br /> <br />
          嘉可能将尽全力向我们的访客提供增值服务，因此可能会链接至由第三方管理的网站。然而，即使该第三方为嘉可能附属公司，因为所有这些网站都具有各自独立于嘉可能的条款与条件以及隐私和数据收集方式，嘉可能将无法控制这些链接网站。上述些链接网站仅限为您提供便利，因此您在访问的同时需自行承担所有风险。嘉可能将尽全力保护网站及其网站上链接的真实性，因此需要收集有关网站与其链接网站的反馈信息。请在查阅从本网站链接至第三方网站的隐私政策后使用此类网站。
          <br /> <br />
          不保证声明 <br /> <br />
          使用此站点所带来的风险由您自行承担。所有资料、信息、产品、软件、程序和服务均“按现状”提供，不附有任何形式的保证或担保。在法律许可的最大范围内，嘉可能明确声明免除所有明示的、暗含的、法定的和其他保证、担保、声明或承诺，包括但不限于有关适销、适用于某种特定用途以及有关所有权和知识产权的非侵权的保证。在不受任何限制的情况下，嘉可能不保证，此站点将不中断、及时、安全或无错误。
          您理解并同意，如果您下载或以其他方式获得资料、信息、产品、软件、程序或服务，则您自行决定执行上述操作，且风险由您自行承担，并且您须自行负责可能产生的任何损害赔偿，包括数据的丢失或对您的计算机系统的损害。
          某些司法区域的强制性法律不允许对保证有所排除，在此情况下则上述排除可能不适用于您。
          <br /> <br />
          隐私政策 <br /> <br />
          你的隐私对嘉可能而言至关重要。因此，我们制定了一项隐私政策，其中说明了我们如何收集、使用、披露、转让和存储你的信息。请你仔细阅读我们的隐私政策，如有任何问题，请告知我们。{" "}
          <br /> <br />
          隐私申明 <br /> <br />
          个人信息是可用于唯一地识别或联系某人的数据。
          你与嘉可能联系时，可能会被要求提供你的个人信息。嘉可能公司内部可互相分享此个人信息，并按本隐私政策使用该信息。嘉可能还可将此信息与其他信息合并在一起，用于提供和改进我们的产品、服务、内容和广告宣传。{" "}
          <br /> <br />
          用户名和密码 <br /> <br />
          当您在注册为用户时，我们要求您填写一张注册表，我们使用注册信息来获得用户的统计资料。我们将会用这些统计数据来给我们的用户分类，以便有针对性地向我们的用户提供新的服务。我们会通过您的邮件地址/微信/00等来通知您这些新的服务
          当您打算注册成用户后，您会得到一个用户名和密码，您只能通过您的密码来使用您的帐号。如果您泄漏了密码，您可能丢失了您的个人识别信息，并且有可能导致对您不利的司法行为，因此防止他人未经授权使用您的密码或进入您的计算机。您应确保在与他人共用一台计算机时，使用完毕后即时退出登录。因此不管任何原因使您的密码安全受到危及，您应该立即和我们取得联系。{" "}
          <br /> <br />
          您的交易行为 <br /> <br />
          我们采集IP地址，登录信息，电子邮件地址，密码，计算机和连接信息诸如浏览器的类型、版本和时区设置、浏览器插件类型和版本、操作系统和平台只是为了安全的必要。如果我们没有发现任何安全问题，我们会及时删除我们收集到的IP地址。我们还跟踪全天的页面访问数据，全天页面访问数据被用来反映网站的流量，我们可以据此为未来的发展制定计划(例如增加服务器)。
          嘉可能的网站、在线服务、云缠量化大师、电子邮件消息和广告宣传可能会使用“cookies”
          和其他技术，如像素标签和网站信标。此等技术帮助我们更好地了解用户的行为，告诉我们人们浏览了我们网站的哪些部分提高和衡量广告以及网络搜索的效果。我们将通过
          cookies 和其他技术收集的信息视为非个人信息.。但是，如果当地法律将 IP
          地址或类似识别标记视为个人信息，则我们亦将此等识别标记视为个人信息。同样，就本隐私政策而言，在非个人信息与个人信息合并在一起的情况下，我们将合并后的信息视为个人信息。{" "}
          <br /> <br />
          我们如何使用你的个人信息 <br /> <br />
          我们会不时地使用你的个人信息以发送重要通知，如关于购买以及我们的条款、条件和政策变更的通讯。由于此信息对你与嘉可能之间的互动至关重要，你不能放弃接收此类沟通信息。我们还会将个人信息用于审计、数据分析和研究等内部目的，以改进嘉可能的产品、服务和与客户之间的沟通。如果你参与抽奖、竟赛或类似推广活动，我们会将你提供的信息用于管理此类活动。{" "}
          <br /> <br />
          邮件/短信
          <br /> <br />
          嘉可能保留通过邮件、短信的形式对本网站注册、购物用户发送订单信息、促销活动等告知服务的权利。如果您在嘉可能注册、购物，表明您已默示同意接受此项服务。
          <br /> <br />
          第三方
          <br /> <br />
          我们不会向任何第三方提供、出售、出租、分享和交易用户的个人信息，除非第三方和嘉可能一起为网站和用户提供服务并且在该服务结束后已将被禁止访问包括其以前能够访问的所有这些资料。嘉可能
          只会为提供或改进我们的产品、服务和广告宣传之目的而与第三方共享个人信息;而不会为第三方的营销目的与第二方共享个人信息。
          当我们被法律强制或依照政府要求提供您的信息，且我们认为就国家安全、执法或具有公众重要性的其他事宜而言，披露是必须的或适当的，我们将善意地披露您的资料。
          <br /> <br />
          儿童
          <br /> <br />
          我们不会在明知对方为年龄不满 13
          周岁的儿童的情况下收集此人的个人信息。如果我们发现我们收集了年龄不满
          13 周岁的儿童的个人信息，我们将采取措施尽快地删除此等信息。
          <br /> <br />
          信息的存储和交换 <br /> <br />
          用户信息和资料被收集和存储在放置于美国服务器上。只有为了做备份的需要时，我们才可能需要将您的资料传送到其他地区服务器上做异地备份(确保您的信息资料将不会丢失){" "}
          <br /> <br />
          全公司对你隐私的承诺 <br /> <br />
          为确保你个人信息的安全，我们将公司的隐私和安全准则告知全体嘉可能雇员，并将在公司内部严格执行隐私保护措施。{" "}
          <br /> <br />
          信息安全 <br /> <br />
          我们网站有相应的安全措施来确保我们掌握的信息不丢失，不被滥用和变造。这些安全措施包括向其它服务器备份数据和对用户密码加密。尽管我们有这些安全措施，但请注意在因特网上不存在“完善的安全措施”。为了遵守法律，执行或适用我们的使用条件和其他协议，或者为了保护本网站、我们的用户或其他人的权利及其财产或安全，我们可能会公开账户或其他个人信息。这包括为防止欺诈等违法活动和减少信用风险而与其他公司和组织交换信息。不过很明显，这并不包括违反本隐私声明中所作的承诺而为商业目的而出售、出租、共享或以其它方式披露个人可识别的信息。{" "}
          <br /> <br />
          联系我们 <br /> <br />
          如果你对本隐私申明或嘉可能的隐私保护措施以及您在使用中的问题有任何意见和建议请和我们联系:chinajkn@gmail.com{" "}
          <br /> <br />
        </ScrollArea>
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

  // 申请记录
  const applyRecord = useModal({
    className: "w-[720px]",
    title: "创建记录",
    closeIcon: true,
    footer: null,
    content: <CreateHistory onReCreate={props.onReCreate} key="创建记录" />,
  });

  return (
    <div className="p-8 ">
      {props.editMode !== true && (
        <div
          className="text-right mb-4 text-xs text-gray-400 "
          onClick={() => {
            applyRecord.modal.open();
          }}
        >
          申请记录
        </div>
      )}

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
                      value={field.value}
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                  viewAgreement.modal.open();
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

      {applyRecord.context}
      {viewAgreement.context}
    </div>
  );
};

export default CreateGroupForm;
