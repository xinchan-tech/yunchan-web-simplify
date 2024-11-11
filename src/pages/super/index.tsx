import { cn } from "@/utils/style"
import { useState } from "react"
import FirstStep from "./components/first-step"
import { ScrollArea } from "@/components"

const SuperStock = () => {
  return (
    <ScrollArea className="h-full bg-muted p-12">
      <div className="flex justify-center my-4 text-secondary">
        <SuperStockTypeTab />
      </div>
      <div>
        <FirstStep />
      </div>
    </ScrollArea>
  )
}

interface SuperStockTypeTabProps {
  onChange?: (type: SuperStockType) => void
}

type SuperStockType = 'tech' | 'basic' | 'super'

const SuperStockTypeTab = (props: SuperStockTypeTabProps) => {
  const [type, setType] = useState<SuperStockType>('tech')
  return (
    <div className="super-stock-type">
      <div className={cn(type === 'tech' && 'super-stock-type-active')} onClick={() => setType('tech')} onKeyDown={() => {}}>技术面</div>
      <div className={cn(type === 'basic' && 'super-stock-type-active')} onClick={() => setType('basic')} onKeyDown={() => {}}>基本面</div>
      <div className={cn(type === 'super' && 'super-stock-type-active')} onClick={() => setType('super')} onKeyDown={() => {}}>超级组合</div>
    
      <style jsx>{`
        {
          .super-stock-type{
            border-width: 1px;
            border-style: solid;
            border-color: hsl(var(--border));
            display: flex;
            align-items: center;
            height: 36px;
            line-height: 34px;
            box-sizing: border-box;
            border-radius: 32px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            user-select: none;
            overflow: hidden;
          }

          .super-stock-type > div{
            padding:0 32px;
            height: 100%;
            border-left: 1px solid hsl(var(--border));
          }

          .super-stock-type > div.super-stock-type-active{
            background-color: hsl(var(--primary));
            color: hsl(var(--foreground));
            transition: all 0.2s ease;
          }
        }
        `}</style>
    </div>
  )
}

export default SuperStock