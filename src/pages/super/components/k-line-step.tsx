import { JknIcon, ToggleGroup, ToggleGroupItem } from "@/components";
import { useAuthorized } from "@/hooks";
import { useMount, useUnmount } from "ahooks";
import { useContext, useRef, useState } from "react";
import { SuperStockContext } from "../ctx";
import { cn } from "@/utils/style";

type StockKLineType = {
  authorized: 0 | 1;
  id: string;
  name: string;
  value: string;
};

const SecondaryStep = () => {
  const ctx = useContext(SuperStockContext);

  const data = (ctx.data?.technology?.children?.stock_kline?.from_datas ??
    []) as StockKLineType[];
  const [value, setValue] = useState<string[]>([]);

  const selection = useRef<string[]>([]);

  useMount(() => {
    ctx.register(
      "stock_cycle",
      2,
      () => [...selection.current],
      () => selection.current.length > 0
    );
  });

  useUnmount(() => {
    ctx.unregister("stock_cycle");
    selection.current = [];
  });

  const [authPermission, toastNotAuth] = useAuthorized("stockPickMaxTime");

  const _onValueChange = (e: string[]) => {
    const max = authPermission();

    if (e.length > max!) {
      toastNotAuth();
      return;
    }
    setValue(e);
    selection.current = e;
  };

  const _onItemClick = (item: StockKLineType) => {
    !item.authorized && toastNotAuth("暂无相关权限，请联系客服");
  };

  return (
    <div className="mt-8 w-full">
      <div className="w-full text-[18px] text-[#B8B8B8] font-[500]">
        时间周期
      </div>
      <div className="w-full flex flex-col">
        <div className="flex flex-row mt-5">
          <ToggleGroup
            className="flex-grow grid grid-cols-9 gap-[10px]"
            type="multiple"
            value={value}
            hoverColor="#2E2E2E"
            onValueChange={_onValueChange}
          >
            {data.map((item) => (
              <div key={item.id} onClick={() => _onItemClick(item)} onKeyDown={() => {}}>
                <ToggleGroupItem
                  disabled={!item.authorized}
                  value={item.value}
                  className={cn(
                    "w-full py-5 px-[14px] rounded-sm border border-[#2E2E2E] bg-transparent relative",
                    "data-[state=on]:bg-accent data-[state=on]:text-secondary",
                  )}
                >
                  {!item.authorized && (<JknIcon name="ic_lock" className="absolute right-0 top-0 w-3 h-3 rounded-none" />)}
                  {item.name}
                </ToggleGroupItem>
              </div>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
};

export default SecondaryStep;
