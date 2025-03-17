import {
  CollectCapsuleTabs,
  JknCheckbox,
  JknRcTable,
  JknRcTableProps,
  StockView,
  SubscribeSpan,
  Button,
  JknIcon,
} from "@/components";
import GoldenPoolStar from "@/pages/golden-pool/components/golden-pool-star";
import { GoldenPoolManager, GoldenPoolNameEdit } from "@/pages/golden-pool/components/golden-pool-manager";
import {
  type StockExtend,
  getStockCollects,
  getStockCollectCates,
} from "@/api";
import { stockUtils } from "@/utils/stock";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCheckboxGroup, useTableData, useTableRowClickToStockTrading, useToast } from "@/hooks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import to from "await-to-js";
import { addStockCollect } from "@/api";

const baseExtends: StockExtend[] = [
  "total_share",
  "basic_index",
  "day_basic",
  "alarm_ai",
  "alarm_all",
  "financials",
];

type TableDataType = ReturnType<typeof stockUtils.toStockWithExt>;

const GoldenPool = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeStockCollectCate, setActiveStockCollectCate] = useState("1");
  const [stockSymbols, setStockSymbols] = useState<string[]>([]);

  const { checked, onChange: onCheckChange, setCheckedAll, getIsChecked: isChecked } = useCheckboxGroup(
    []
  );

  const collects = useQuery({
    queryKey: [getStockCollects.cacheKey, activeStockCollectCate],
    queryFn: () =>
      getStockCollects({
        cate_id: +activeStockCollectCate,
        limit: 300,
        extend: baseExtends,
      }),
  });

  const [list, { setList, onSort }] = useTableData<TableDataType>([], "symbol");

  useEffect(() => {
    const stockList = collects.data?.items.map((o) =>
      ({
        ...stockUtils.toStockWithExt(o.stock, {
          extend: o.extend,
          name: o.name,
          symbol: o.symbol,
        }),
        collect: 1
      })
    ) ?? [];
    
    setList(stockList);
    
    // 更新 checked 数组，使其包含表格中所有的 symbol 集合
    if (stockList.length > 0) {
      const allSymbols = stockList.map(item => item.symbol);
      setStockSymbols(allSymbols);
    }
  }, [collects.data, setList, setStockSymbols]);

  const onActiveStockChange = (v: string) => {
    setActiveStockCollectCate(v);
  };

  const isAllChecked = useMemo(() => {
    return stockSymbols.length > 0 && stockSymbols.every(symbol => isChecked(symbol));
  }, [stockSymbols, isChecked]);

  const handleCheckAll = useCallback((checked: boolean) => {
    if (checked) {
      // 全选：传入所有 symbol
      setCheckedAll(stockSymbols);
    } else {
      // 取消全选：传入空数组
      setCheckedAll([]);
    }
  }, [stockSymbols, setCheckedAll]);

  const columns: JknRcTableProps<TableDataType>["columns"] = useMemo(
    () => [
      {
        title: (
          <div className="inline-flex items-center whitespace-nowrap">
            <span className="inline-flex items-center">
              <GoldenPoolStar.Batch cateId={+activeStockCollectCate} checked={true} checkedChildren={stockSymbols} onUpdate={() => {
                // 同时刷新表格数据和 Tab 标题数据
                collects.refetch();
                // 刷新收藏分类数据，更新 Tab 标题
                queryClient.invalidateQueries({ queryKey: [getStockCollectCates.cacheKey] });
              }} />
            </span>
            <span className="mr-3"/>
            <span className="inline-flex items-center">名称代码</span>
          </div>
        ),
        dataIndex: "name",
        align: "left",
        sort: true,
        render: (_, row) => <div className='flex items-center h-[33px]'>
          <div className="flex justify-center items-center">
            <GoldenPoolStar cateId={+activeStockCollectCate} checked={true} code={row.symbol} onUpdate={() => {
              // 同时刷新表格数据和 Tab 标题数据
              collects.refetch();
              // 刷新收藏分类数据，更新 Tab 标题
              queryClient.invalidateQueries({ queryKey: [getStockCollectCates.cacheKey] });
            }} />
          </div>
          <span className="mr-3"/>
          <StockView name={row.name} code={row.symbol as string} showName />
        </div>
      },
      {
        title: '现价',
        dataIndex: "close",
        align: "left",
        width: '13%',
        sort: true,
        render: (_, row) => (
          <SubscribeSpan.PriceBlink
            showColor={false}
            symbol={row.symbol}
            decimal={2}
            initValue={row.close}
            initDirection={stockUtils.isUp(row)}
          />
        ),
      },
      {
        title: '涨跌幅',
        dataIndex: "percent",
        align: "left",
        width: '13%',
        sort: true,
        render: (_, row) => (
          <SubscribeSpan.PercentBlink
            symbol={row.symbol}
            decimal={2}
            initValue={stockUtils.getPercent(row)}
            initDirection={stockUtils.isUp(row)}
          />
        ),
      },
      {
        title: '成交额',
        dataIndex: "turnover",
        align: "left",
        width: '13%',
        sort: true,
        render: (_, row) => (
          <SubscribeSpan.TurnoverBlink
          showColor={false}
            symbol={row.symbol}
            decimal={2}
            initValue={row.turnover}
          />
        ),
      },
      {
        title: '总市值',
        dataIndex: "marketValue",
        align: "left",
        width: '13%',
        sort: true,
        render: (_, row) => (
          <SubscribeSpan.MarketValue
          showColor={false}
            symbol={row.symbol}
            decimal={2}
            initValue={stockUtils.getMarketValue(row)}
            totalShare={row.totalShare ?? 0}
          />
        ),
      },
      {
        title: '所属行业',
        dataIndex: "industry",
        align: "left",
        width: '15%',
        sort: true,
        render: (_, row) => <span className="text-[14px]">{row.industry}</span>
      },
      {
        title: (
          <div className="w-full text-center">
            <JknCheckbox checked={isAllChecked} onCheckedChange={handleCheckAll} />
          </div>
        ),
        dataIndex: 'check',
        align: 'right',
        width: '5%',
        render: (_, row) => (
          <div className="w-full text-center">
            <JknCheckbox checked={isChecked(row.symbol)} onCheckedChange={v => onCheckChange(row.symbol, v)} />
          </div>
        )
      }
    ],
    [
      activeStockCollectCate,
      stockSymbols,
      list,
      collects.refetch,
      isAllChecked,
      checked,
    ]
  );

  const onRowClick = useTableRowClickToStockTrading("symbol");

  const GoldenPoolCateList = ({ checked, onUpdate }: { checked: string[]; onUpdate: () => void }) => {
    const cates = useQuery({
      queryKey: [getStockCollectCates.cacheKey],
      queryFn: () => getStockCollectCates(),
    });

    const moveToGoldenPool = async (cateId: string) => {
      if (checked.length === 0) {
        toast({ description: "请先选择股票" });
        return;
      }

      const [err] = await to(addStockCollect({
        symbols: checked,
        cate_ids: [Number(cateId)],
      }));

      if (err) {
        toast({ description: err.message });
        return;
      }

      toast({ description: "移动成功" });
      
      onUpdate?.();
    };

    if (cates.isLoading || !cates.data) {
      return null;
    }

    return (
      <>
        {cates.data.map((cate) => (
          <DropdownMenuItem key={cate.id} onClick={() => moveToGoldenPool(cate.id)}>
            {cate.name}
          </DropdownMenuItem>
        ))}
      </>
    );
  };

  return (
    <div className="h-full w-full overflow-hidden flex justify-center bg-black">
      <div className="h-full overflow-hidden flex flex-col min-w-[918px] w-[60%] max-w-[1400px] pt-[40px] golden-pool">
        <div className="flex items-center justify-center flex-shrink-0">
          <div className="flex-1 overflow-x-auto">
            <CollectCapsuleTabs
              activeKey={activeStockCollectCate}
              onChange={onActiveStockChange}
            />
          </div>
          <div className="text-secondary">
            <GoldenPoolManager />
          </div>
        </div>
        <div className="flex items-center justify-end flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 mr-4 px-5 border-[#2E2E2E] text-[#808080]">
                移动至
                <JknIcon.Svg name="arrow-down" size={8} className="" color="#808080" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40 bg-[#1F1F1F] text-[#B8B8B8] [&>*:hover]:bg-[#2E2E2E]">
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <GoldenPoolNameEdit onUpdate={() => {
                  queryClient.invalidateQueries({ queryKey: [getStockCollectCates.cacheKey] });
                }}>
                  <DropdownMenuItem>
                    <span>新建分组</span>
                  </DropdownMenuItem>
                </GoldenPoolNameEdit>
              </div>
              <DropdownMenuSeparator className="bg-[#2E2E2E]" />
              <GoldenPoolCateList checked={checked} onUpdate={() => {
                collects.refetch();
                queryClient.invalidateQueries({ queryKey: [getStockCollectCates.cacheKey] });
              }} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex-1 overflow-hidden">
          <JknRcTable
            headerHeight={48}
            isLoading={collects.isLoading}
            rowKey="symbol"
            columns={columns}
            data={list}
            onRow={onRowClick}
            onSort={onSort}
          />
        </div>
        <style jsx>{`
            .golden-pool :global(.ant-checkbox-inner) {
              border-color: var(--text-tertiary-color);
            }

            .golden-pool :global(.ant-checkbox-checked .ant-checkbox-inner) {
              border-color: #388bff;
            }
        `}
        </style>
        <style jsx global>{`
          .golden-pool .rc-table th {
            padding-top: 20px;
            padding-bottom: 20px;
          }
        `}
        </style>
      </div>
    </div>
  );
};

export default GoldenPool;
