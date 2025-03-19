import {
  type StockExtend,
  getPlateList,
  getPlateStocks,
  getStockCollectCates,
  getStockCollects,
} from "@/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
  JknIcon,
  JknRcTable,
  type JknRcTableProps,
  StockView,
  SubscribeSpan,
  ToggleGroup,
  ToggleGroupItem,
  Checkbox,
} from "@/components";
import {
  useAuthorized,
  useCheckboxGroup,
  useTableData,
  useTableRowClickToStockTrading,
} from "@/hooks";
import { type Stock, stockUtils } from "@/utils/stock";
import { useQuery } from "@tanstack/react-query";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useMount, useUnmount } from "ahooks";
import { SuperStockContext } from "../ctx";
import { CrownIcon, StockTrendIcon } from "./super-icon";
import { cn } from "@/utils/style";
import { SuperCarousel } from "./super-carousel";

const baseExtends: StockExtend[] = [
  "total_share",
  "basic_index",
  "day_basic",
  "alarm_ai",
  "alarm_all",
  "financials",
];

const FirstStep = () => {
  const [type, setType] = useState("FeaturedRanking");

  return (
    <div className="w-full">
      <div className="w-full text-[18px] text-[#B8B8B8] font-[500] flex flex-row gap-5 items-center">
        <span>选股范围</span>
        <span className="w-[1px] h-[14px] bg-[#2E2E2E]" />
        <span>
          <DropdownSelector onSelect={setType} selectedType={type} />
        </span>
      </div>

      <div className="mt-8">
        {
          {
            // 特色榜单
            FeaturedRanking: <FeaturedRankingPanel />,
            // 股票金池
            GoldenPool: <GoldenPoolPanel />,
            // 行业板块
            IndustrySector: <SectorPanel type={1} />,
            // 概念板块
            ConceptSector: <SectorPanel type={2} />,
          }[type]
        }
      </div>
    </div>
  );
};

interface DropdownSelectorProps {
  onSelect: (type: string) => void;
  selectedType: string;
}

/**
 * 下拉选择组件
 * @param param0 下拉选择组件参数
 * @param param0.onSelect 选择回调
 * @param param0.selectedType 选中类型
 * @returns 下拉选择组件
 */
const DropdownSelector = ({
  onSelect,
  selectedType,
}: DropdownSelectorProps) => {
  const options = [
    {
      id: "FeaturedRanking",
      name: "特色榜单",
      icon: <CrownIcon />,
    },
    {
      id: "GoldenPool",
      name: "股票金池",
      icon: <StockTrendIcon />,
    },
    {
      id: "IndustrySector",
      name: "行业板块",
      icon: <StockTrendIcon />,
    },
    {
      id: "ConceptSector",
      name: "概念板块",
      icon: <StockTrendIcon />,
    },
  ];

  const selectedOption =
    options.find((option) => option.id === selectedType) || options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-[28px] px-[10px] border-[#808080] text-[#B8B8B8]"
        >
          <div className="flex items-center gap-[6px]">
            {selectedOption.icon}
            {selectedOption.name}
          </div>
          <JknIcon.Svg
            name="arrow-down"
            size={8}
            className=""
            color="#B8B8B8"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-36 text-base bg-[#1F1F1F] text-[#B8B8B8] [&>*:hover]:bg-[#2E2E2E] border-solid border-[#2E2E2E]">
        {options.map((option) => (
          <DropdownMenuItem key={option.id} onClick={() => onSelect(option.id)}>
            <div className="flex items-center gap-[6px]">
              {option.icon}
              {option.name}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * 特色榜单
 */
const FeaturedRankingPanel = () => {
  const ctx = useContext(SuperStockContext);
  const data = (ctx.data?.stock_range?.children?.t_recommend.from_datas ??
    []) as unknown as {
    name: string;
    value: string;
    authorized: 0 | 1;
  }[];
  const selection = useRef<string[]>([]);

  useMount(() => {
    ctx.register(
      "recommend",
      1,
      () => [...selection.current],
      () => selection.current.length > 0
    );
  });

  useUnmount(() => {
    ctx.unregister("recommend");
    selection.current = [];
  });

  const [_, toastNotAuth] = useAuthorized();

  const getIcon = (name: string) => {
    if (name === '首页热门榜') {
      return <JknIcon name="ic_fire_red" />;
    } else if (name === '小盘黑马榜') {
      return <JknIcon name="ic_diamond" />;
    } else if (name === '今日股王榜') {
      return <JknIcon name="ic_crown" />;
    } else if (name === 'TOP1000+强') {
      return <JknIcon name="ic_good" />;
    }
    return null;
  };

  const hasRecommend = (name: string) => {
    if (name === '首页热门榜') {
      return true;
    } else if (name === '小盘黑马榜') {
      return true;
    } else if (name === '今日股王榜') {
      return true;
    } else if (name === 'TOP1000+强') {
      return true;
    }
    return false;
  };

  return (
    <ToggleGroup
      className="grid grid-cols-4 gap-4"
      type="multiple"
      onValueChange={(value) => {
        selection.current = value;
      }}
      hoverColor="#2E2E2E"
    >
      {data?.map((child) =>
        child.name !== "" ? (
          <div
            key={child.value}
            onClick={() => !child.authorized && toastNotAuth()}
            onKeyDown={() => {}}
          >
            <ToggleGroupItem
              value={child.value}
              disabled={!child.authorized}
              className={cn(
                "w-full h-16 rounded-sm border border-[#2E2E2E] bg-transparent relative group",
                "data-[state=on]:bg-transparent",
                "data-[state=on]:text-[#DBDBDB] data-[state=on]:border-[#DBDBDB]",
              )}
            >
              {!child.authorized && (
                <JknIcon name="ic_lock" className="absolute right-0 top-0 w-3 h-3 rounded-none" />
              )}
              {hasRecommend(child.name) && (
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: -16,
                    width: 32,
                    fontSize: 10,
                    height: 0,
                    color: "white",
                    textAlign: "center",
                    lineHeight: "16px",
                    borderWidth: "0px 16px 16px",
                    borderStyle: "none solid solid",
                    borderColor: "transparent transparent #f23645",
                    transform: "rotate(45deg)",
                  }}
                  className="opacity-60 group-hover:opacity-100 group-data-[state=on]:opacity-100"
                >
                  推荐
                </div>
              )}
              <div className="flex items-center gap-[2px]">
                <span className="flex items-center opacity-60 group-hover:opacity-100 group-data-[state=on]:opacity-100">
                  {getIcon(child.name)}
                </span>
                <span>{child.name}</span>
              </div>
            </ToggleGroupItem>
          </div>
        ) : null
      )}
    </ToggleGroup>
  );
};

/**
 * 股票金池
 */
const GoldenPoolPanel = () => {
  const [cateId, setCateId] = useState(1);

  return (
    <div className="flex h-full overflow-hidden">
      <GoldenPool onChange={setCateId} />
      <GoldenPoolList cateId={cateId} />
    </div>
  );
};

interface GoldenPoolProps {
  onChange?: (id: number) => void;
}

const GoldenPool = (props: GoldenPoolProps) => {
  const selection = useRef<string[]>([]);
  const ctx = useContext(SuperStockContext);
  const { checked, toggle, getIsChecked } = useCheckboxGroup([]);
  const collects = useQuery({
    queryKey: [getStockCollectCates.cacheKey],
    queryFn: () => getStockCollectCates(),
  });
  useMount(() => {
    ctx.register(
      "collect",
      1,
      () => [...selection.current],
      () => selection.current.length > 0
    );
  });

  useUnmount(() => {
    ctx.unregister("collect");
    selection.current = [];
  });

  useEffect(() => {
    selection.current = checked;
  }, [checked]);

  const columns: JknRcTableProps<{ name: string; id: string }>["columns"] = [
    {
      title: <JknIcon name="checkbox_mult_nor_dis" className="w-4 h-4" />,
      dataIndex: "select",
      align: "center",
      width: 40,
      render: (_, row) => (
        <div className="flex items-center justify-center w-full">
          <Checkbox
            checked={getIsChecked(row.id)}
            onCheckedChange={() => toggle(row.id)}
          />
        </div>
      ),
    },
    {
      title: "序号",
      dataIndex: "index",
      align: "center",
      width: 40,
      render: (_, __, index) => <div className="text-center">{index + 1}</div>,
    },
    {
      title: "金池名称",
      dataIndex: "name",
    },
  ];

  return (
    <div className="h-[calc(100%-52px)] w-[30%]">
      <JknRcTable
        rowKey="id"
        onRow={(r) => ({
          onClick: () => {
            toggle(r.id);
            props.onChange?.(+r.id);
          },
        })}
        data={collects.data ?? []}
        columns={columns}
      />
    </div>
  );
};

interface GoldenPoolListProps {
  cateId: number;
}
const GoldenPoolList = (props: GoldenPoolListProps) => {
  const query = useQuery({
    queryKey: [getStockCollects.cacheKey, props.cateId],
    queryFn: () =>
      getStockCollects({
        cate_id: props.cateId,
        extend: baseExtends,
        limit: 300,
      }),
    enabled: !!props.cateId,
  });

  const [list, { setList, onSort }] = useTableData<Stock>([], "symbol");

  useEffect(() => {
    setList(
      query.data?.items.map((o) => {
        const s = stockUtils.toStock(o.stock, {
          extend: o.extend,
          name: o.name,
          symbol: o.symbol,
        });

        return {
          ...s,
          percent: stockUtils.getPercent(s),
          marketValue: stockUtils.getMarketValue(s),
        };
      }) ?? []
    );
  }, [query.data, setList]);

  const columns: JknRcTableProps<ArrayItem<typeof list>>["columns"] = [
    {
      title: "序号",
      dataIndex: "index",
      align: "center",
      width: 60,
      render: (_, __, index) => <div className="text-center">{index + 1}</div>,
    },
    {
      title: "金池名称",
      dataIndex: "name",
      sort: true,
      render: (name, row) => <StockView name={name} code={row.symbol} />,
    },
    {
      title: "现价",
      dataIndex: "close",
      sort: true,
      align: "right",
      width: 90,
      render: (close, row) => (
        <SubscribeSpan.PriceBlink
          symbol={row.symbol}
          initValue={close ?? 0}
          decimal={3}
          initDirection={stockUtils.isUp(row)}
        />
      ),
    },
    {
      title: "涨跌幅",
      dataIndex: "percent",
      sort: true,
      align: "right",
      width: 90,
      render: (percent, row) => (
        <SubscribeSpan.PercentBlockBlink
          symbol={row.symbol}
          decimal={2}
          initValue={percent}
          initDirection={stockUtils.isUp(row)}
        />
      ),
    },
    {
      title: "成交额",
      dataIndex: "turnover",
      align: "right",
      sort: true,
      width: 90,
      render: (turnover, row) => (
        <SubscribeSpan.TurnoverBlink
          showColor={false}
          symbol={row.symbol}
          decimal={2}
          initValue={turnover}
        />
      ),
    },
    {
      title: "总市值",
      dataIndex: "marketValue",
      sort: true,
      align: "right",
      width: 90,
      render: (marketValue, row) => (
        <SubscribeSpan.MarketValueBlink
          symbol={row.symbol}
          showColor={false}
          decimal={2}
          initValue={marketValue}
          totalShare={row.totalShare ?? 0}
        />
      ),
    },
  ];

  const onRowClick = useTableRowClickToStockTrading("symbol");

  return (
    <div className="h-[calc(100%-52px)] w-[70%]">
      <JknRcTable
        rowKey="symbol"
        isLoading={query.isLoading}
        columns={columns}
        data={list}
        onSort={onSort}
        onRow={onRowClick}
      />
    </div>
  );
};

/**
 * 行业板块 / 概念板块
 * @param props 
 * @param props.type 1: 行业板块, 2: 概念板块
 * @returns 
 */
const SectorPanel = (props: {type: 1 | 2}) => {
  // 获取板块数据
  const plateQuery = useQuery({
    queryKey: [getPlateList.cacheKey, props.type],
    queryFn: () => getPlateList(props.type),
    placeholderData: [],
  });

  // 状态管理
  const [selectedPlateIds, setSelectedPlateIds] = useState<string[]>([]);
  const ctx = useContext(SuperStockContext);
  const selection = useRef<string[]>([]);

  // 注册到上下文
  useMount(() => {
    ctx.register(
      "sectors",
      1,
      () => [...selection.current],
      () => selection.current.length > 0
    );
  });

  // 组件卸载时清理
  useUnmount(() => {
    ctx.unregister("sectors");
    selection.current = [];
  });

  // 同步选中状态到引用
  useEffect(() => {
    selection.current = selectedPlateIds;
  }, [selectedPlateIds]);

  // 处理选中状态变化
  const handleSelectionChange = (ids: string[]) => {
    setSelectedPlateIds(ids);
  };

  // 将 PlateDataType 转换为 StockDataItem
  const convertToEconomicData = useMemo(() => {
    if (!plateQuery.data) return [];
    
    return plateQuery.data.map(item => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      percent: item.change,
    }));
  }, [plateQuery.data, selectedPlateIds]);

  return (
    <div className="flex flex-col h-full">
      {/* 走马灯组件 */}
      {plateQuery.data && plateQuery.data.length > 0 ? (
        <SuperCarousel
          items={convertToEconomicData}
          preloadPages={2}
          selectedIds={selectedPlateIds}
          onSelectionChange={handleSelectionChange}
        />
      ) : (
        <div className="flex items-center justify-center h-20 rounded-md">
          <span className="#DBDBDB">
            {plateQuery.isLoading ? '加载中...' : '暂无数据'}
          </span>
        </div>
      )}
    </div>
  );
};


export default FirstStep;
