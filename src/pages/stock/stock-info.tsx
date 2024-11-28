import { CapsuleTabs } from "@/components"
import { useQueryParams } from "@/hooks"

export const StockInfo = () => {
  const queryParams = useQueryParams()
  const code = queryParams.get('symbol') ?? 'QQQ'

  return (
    <div className="border border-solid border-border">
      <div className="p-1 border-0 border-b border-solid border-border">
        <CapsuleTabs activeKey="quote">
          <CapsuleTabs.Tab className="flex-1 text-center" label="报价" value="quote" />
          <CapsuleTabs.Tab className="flex-1 text-center" label="简介" value="news" />
        </CapsuleTabs>
      </div>
      <div>
        
      </div>
    </div>
  )
}