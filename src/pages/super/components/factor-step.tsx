import type { StockCategory } from "@/api";
import { JknIcon, ToggleGroup, ToggleGroupItem } from "@/components";
import { useAuthorized } from "@/hooks";
import { appEvent } from "@/utils/event";
import { useMount, useUnmount } from "ahooks";
import { useContext, useRef, useState } from "react";
import { SuperStockContext } from "../ctx";
import { cn } from "@/utils/style";

const FactorStep = () => {
  const ctx = useContext(SuperStockContext);
  const data = ctx.data?.technology?.children?.factor
    .children as unknown as StockCategory[];

  const [selection, setSelection] = useState<string[]>([]);
  const result = useRef<string[]>([]);
  useMount(() => {
    ctx.register(
      "category_ids_ext",
      10,
      () => [...result.current],
      () => true
    );
  });

  useUnmount(() => {
    ctx.unregister("category_ids_ext");
    result.current = [];
    setSelection([]);
  });

  //TODO 临时方案 待优化
  useMount(() => {
    appEvent.on("cleanPickerStockFactor", () => {
      result.current = [];
      setSelection([]);
    });
  });

  useUnmount(() => {
    appEvent.off("cleanPickerStockFactor");
  });

  const _onValueChange = (e: string[]) => {
    appEvent.emit("cleanPickerStockMethod");

    result.current = e;
    setSelection(e);
  };

  const [_, toastNotAuth] = useAuthorized();

  return (
    <div className="mt-8 w-full">
      <div className="w-full text-[18px] text-[#B8B8B8] font-[500]">
        叠加策略
      </div>
      <div className="w-full pt-5 pb-8 flex flex-col">
        <div className="flex flex-row mt-5">
          <div className="w-[132px] text-base font-[500] flex-shrink-0 flex-grow-0 text-[#B8B8B8]">
            <div className="flex flex-row">底部策略</div>
          </div>
          <ToggleGroup
            className="flex-grow grid grid-cols-3 gap-[10px]"
            type="multiple"
            value={selection}
            hoverColor="#2E2E2E"
            onValueChange={_onValueChange}
          >
            {data?.map((child) =>
              child.name !== "" ? (
                <div
                  key={child.id}
                  onClick={() => !child.authorized && toastNotAuth()}
                  onKeyUp={() => {}}
                >
                  <ToggleGroupItem
                    disabled={!child.authorized}
                    value={child.id}
                    className={cn(
                      "w-full py-5 px-[14px] box-border rounded-sm border border-[#2E2E2E] bg-transparent relative",
                      "data-[state=on]:bg-transparent",
                      "data-[state=on]:text-[#DBDBDB] data-[state=on]:border-[#DBDBDB]",
                    )}
                  >
                    {!child.authorized && (<JknIcon name="ic_lock" className="absolute right-0 top-0 w-3 h-3 rounded-none" />)}
                    {child.name}
                  </ToggleGroupItem>
                </div>
              ) : null
            )}
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
};

export default FactorStep;
