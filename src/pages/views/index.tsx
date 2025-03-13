import { CapsuleTabs } from "@/components";
import { useState } from "react";
import PageTable from "./components/page-table";
import SectorTable from "./components/sector-table";
import SingleTable from "./single-table";
import { cn } from "@/utils/style";

/**
 * Tab项的基础样式
 */
const TAB_BASE_STYLE = "h-[30px] p-[4px] rounded-md flex items-center justify-center relative";

/**
 * 视图组件：展示不同类型的股票数据
 */
const Views = () => {
  const [activeKey, setActiveKey] = useState("all");

  /**
   * 生成Tab项的样式
   * @param value - Tab的值
   * @returns 组合后的className字符串
   */
  const getTabStyle = (value: string) => cn(
    TAB_BASE_STYLE,
    activeKey === value && "!bg-accent text-[#DBDBDB]"
  );

  /**
   * 生成Tab的标签内容
   * @param text - 标签文本
   * @param isActive - 是否处于激活状态
   * @returns 标签内容的JSX元素
   */
  const getTabLabel = (text: string, isActive: boolean) => (
    <div className="relative">
      <span className="invisible">{text}</span>
      <span className={cn(
        "absolute left-0 top-0 w-full h-full flex items-center justify-center",
        isActive && "font-bold"
      )}>
        {text}
      </span>
    </div>
  );

  return (
    <div className="h-full w-full overflow-hidden flex justify-center bg-black">
      <div className="h-full overflow-hidden flex flex-col w-[918px] mt-[40px]">
        <div className="flex items-center flex-shrink-0">
          <CapsuleTabs
            className={cn("space-x-3")}
            activeKey={activeKey}
            onChange={setActiveKey}
          >
            <CapsuleTabs.Tab
              className={getTabStyle("all")}
              label={getTabLabel("全部美股", activeKey === "all")}
              value="all"
            />
            <CapsuleTabs.Tab
              className={getTabStyle("industry")}
              label={getTabLabel("行业板块", activeKey === "industry")}
              value="industry"
            />
            <CapsuleTabs.Tab
              className={getTabStyle("concept")}
              label={getTabLabel("概念板块", activeKey === "concept")}
              value="concept"
            />
            <CapsuleTabs.Tab
              className={getTabStyle("etf")}
              label={getTabLabel("ETF", activeKey === "etf")}
              value="etf"
            />
            <CapsuleTabs.Tab
              className={getTabStyle("china")}
              label={getTabLabel("中概股", activeKey === "china")}
              value="china"
            />
            {/* <CapsuleTabs.Tab label="纳指成份" value="ixic" /> */}
            {/* <CapsuleTabs.Tab label="标普成分" value="spx" /> */}
            {/* <CapsuleTabs.Tab label="道指成分" value="dji" /> */}
            {/* <CapsuleTabs.Tab label="昨日多强榜↑" value="yesterday_bull" /> */}
            {/* <CapsuleTabs.Tab label="昨日空强榜↓" value="yesterday_bear" /> */}
            {/* <CapsuleTabs.Tab label="3日涨幅榜↑" value="short_amp_up" /> */}
            {/* <CapsuleTabs.Tab label="3日跌幅榜↓" value="short_amp_d" /> */}
            {/* <CapsuleTabs.Tab label="跳空涨跌榜" value="gap" /> */}
            {/* <CapsuleTabs.Tab label="昨日放量榜" value="release" /> */}
          </CapsuleTabs>
        </div>
        <div className="flex-1 overflow-hidden">
          {!activeKey ||
          ["all", "ixic", "spx", "dji", "etf"].includes(activeKey) ? (
            <PageTable type={activeKey} />
          ) : ["industry", "concept"].includes(activeKey) ? (
            <SectorTable type={activeKey === "industry" ? 1 : 2} />
          ) : (
            <SingleTable type={activeKey} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Views;
