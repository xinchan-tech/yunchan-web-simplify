import type { getMallProducts } from "@/api";
import {
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  JknIcon,
} from "@/components";
import { useToast } from "@/hooks";
import { useConfig } from "@/store";
import { cn } from "@/utils/style";
import Decimal from "decimal.js";
import { useEffect, useState } from "react";
import { CheckIcon, CloseIcon, GradientCheckIcon } from "./components/mall-icon";

/**
 * 基础页面属性接口
 */
interface BasicPageProps {
  basic: Awaited<ReturnType<typeof getMallProducts>>["basic"];
  type: string;
  title: string;
  onSubmit: (form: {
    productId: string;
    name: string;
    price: string;
    model: string;
    checked: boolean;
  }) => void;
}

/**
 * PublicizeItem组件 - 展示产品特性项
 * @param props 组件属性
 * @param props.publicize 特性数据，格式为[状态码, 名称, 额外信息]
 * @param props.index 特性在列表中的索引
 * @param props.isActive 是否选中
 * @param props.isChannel 是否是聊天社群
 */
const PublicizeItem = ({
  publicize,
  index,
  isActive,
  isChannel
}: {
  publicize: [number, string, any?]
  index: number;
  isActive: boolean;
  isChannel: boolean;
}) => {
  const isDisabled = publicize[0] === 0;
  const publicizeName = publicize[1];

  return (
    <div className="flex items-center  space-x-2 text-base font-pingfang">
      <div className="flex items-center justify-center">
      {isDisabled ? (
        <CloseIcon />
      ) : isChannel ? (
        <GradientCheckIcon />
      ) : (
        <CheckIcon color={isActive ? "#FADFB0" : "#C0B8AA"} />
      )}
      </div>

      <span className="flex items-center text-nowrap ml-[10px]">
        <span
          className={cn(isActive && isChannel && "gradient-text")}
          style={{
            color: !isActive ? "#666666" : (!isChannel ? "#C0B8AA" : ""),
            opacity: isDisabled ? 0.4 : 1
          }}
        >
          {publicizeName}
        </span>
        {index === 2 && publicize[2] ? (
          <HoverCard>
            <HoverCardTrigger asChild>
              <span className="flex items-center ml-1">
                <JknIcon.Svg name="explain" className="w-5 h-5" color="#3D3D3D" />
              </span>
            </HoverCardTrigger>
            <HoverCardContent className="p-0 w-[520px]">
              <div className="flex ">
                <div className="flex-1 border-0 border-r border-solid border-accent">
                  <div className="bg-accent">主图</div>
                  <div className="grid grid-cols-2 text-start gap-2 p-2">
                    {(publicize[2].main as string).split(",").map((s) => (
                      <span key={s}>{s}</span>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-accent">副图</div>
                  <div className="grid grid-cols-2 text-start gap-2 p-2">
                    {(publicize[2].secondary as string).split(",").map((s) => (
                      <span key={s}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        ) : null}
      </span>
    </div>
  );
};

/**
 * 基础页面组件 - 展示产品列表
 * @param props 组件属性
 */
export const BasicPage = (props: BasicPageProps) => {
  const unit = props.type === "model_month" ? "月" : "年";
  const hasChinaIp = useConfig((s) => s.ip === "CN");
  const { toast } = useToast();
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  
  // 默认选中最后一个产品
  useEffect(() => {
    if (props.basic.length > 0) {
      setActiveProductId(props.basic[props.basic.length - 1].id);
    }
  }, [props.basic]);

  /**
   * 处理购买操作
   * @param productId 产品ID
   * @param price 产品价格
   * @param name 产品名称
   */
  const onBuy = (productId: string, price: string, name: string) => {
    const product = props.basic.find((b) => b.id === productId);
    if (!product) {
      return;
    }

    if (product.forbidden) {
      toast({
        description: product.forbidden,
      });
      return;
    }

    setActiveProductId(productId);

    props.onSubmit({
      productId,
      name: `${props.title}-${name}`,
      price,
      model: props.type,
      checked: false,
    });
  };

  return (
    <div>
      <div className="flex justify-between space-x-[10px]">
        {props.basic.map((product) => {
          const isActive = activeProductId === product.id;

          return (
            <div
              key={product.id}
              className={cn(
                "relative w-[280px] p-[1px] rounded-2xl box-border space-y-[10px] transition-all duration-300",
                isActive ? "active-card" : "default-card"
              )}
              onClick={() => setActiveProductId(product.id)}
            >
              <div
                className="py-10 px-5 rounded-2xl text-center cursor-pointer"
                style={{
                  background: isActive ? "#19130F" : "#0E0E0E"
                }}
              >
                {product.is_hot === "1" ? (
                  <div className="absolute right-[-3px] top-[-7px] w-[104px] h-[33px] flex items-center justify-center recommend-tag">
                    超值推荐
                  </div>
                ) : null}
                <div>
                  <div className={cn("text-[20px]", isActive && "text-[#F5E1CF]")}>
                    {product.name}
                  </div>
                  <div className="flex items-end justify-center text-5xl pt-5">
                    <span className={cn("price-text", isActive && "text-[#F5E1CF]")}>
                      ${product[props.type as keyof typeof product]}
                    </span>
                    <span className="text-base text-[#575757] font-pingfang">
                      /{unit}
                    </span>
                  </div>
                  {props.type !== "model_month" ? (
                    <div className="pt-[10px] text-base text-[#575757] line-through">
                      ${Decimal.create(+product.model_month * 12).toFixed(2)}/
                      {unit}
                    </div>
                  ) : null}
                </div>
                <div className="mt-8">
                  <Button
                    block
                    size="lg"
                    className={cn(
                      "w-[240px] h-12 rounded-[8px] font-pingfang text-xl bg-transparent border-[#666666] border border-solid",
                      !isActive && "hover:bg-[#3a3a3a] "
                    )}
                    style={{
                      background: isActive
                        ? "linear-gradient(to right, #FADFB0, #FECA90, #EC9B51)"
                        : "",
                      color: isActive ? "#6A4C18" : "#F5E1CF",
                      fontWeight: isActive ? "bold" : "normal",
                    }}
                    onClick={(e) => {
                      e.stopPropagation(); // 阻止冒泡，避免触发卡片的点击事件
                      onBuy(
                        product.id,
                        product[props.type as keyof typeof product] as string,
                        product.name
                      );
                    }}
                  >
                    立即开通
                  </Button>
                </div>

                <div className="space-y-3 text-base !mt-8 pl-2">
                  {/* 聊天社群 */}
                  {!hasChinaIp && product.has_channel === 1 ? (
                    <PublicizeItem
                      key={-1}
                      publicize={[-1, '聊天社群']}
                      index={-1}
                      isActive={isActive}
                      isChannel={true}
                    />
                  ) : null}
                  {product.publicize.map((publicize, index) => (
                    <PublicizeItem
                      key={index}
                      publicize={publicize}
                      index={index}
                      isActive={isActive}
                      isChannel={false}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <style jsx>
        {`
          /* 导入 Heebo 字体 */
          @import url("https://fonts.googleapis.com/css2?family=Heebo:wght@700&display=swap");

          /* 默认卡片样式 */
          .default-card {
            background: linear-gradient(to bottom, #2e2e2e, #1d1919);
          }

          /* 激活状态卡片样式 */
          .active-card {
            background: linear-gradient(to bottom, #e7c88d, #0b0404);
            box-shadow: 0 10px 15px rgba(0, 0, 0, 0.3);
            transform: translateY(-20px);
          }

          /* 价格文本样式 */
          .price-text {
            font-family: "Heebo", sans-serif;
            font-weight: 700;
          }

          /* 推荐标签渐变背景 */
          .recommend-tag {
            background: linear-gradient(to right, #fadfb0, #feca90, #ec9b51);
            border-top-left-radius: 4px;
            border-top-right-radius: 12px;
            border-bottom-left-radius: 12px;
            border-bottom-right-radius: 4px;
            color: #6a4c18;
            font-size: 18px;
          }

          /* 渐变文本样式 */
          :global(.gradient-text) {
            background: linear-gradient(to right, #fadfb0, #feca90, #ec9b51);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            font-weight: 500;
          }
        `}
      </style>
    </div>
  );
};
