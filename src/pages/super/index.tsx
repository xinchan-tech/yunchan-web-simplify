import { getStockCategoryData, getStockSelection } from "@/api"
import { Button, JknIcon, ScrollArea } from "@/components"
import { useToast } from "@/hooks"
import { cn } from "@/utils/style"
import { useQuery } from "@tanstack/react-query"
import { useBoolean } from "ahooks"
import to from "await-to-js"
import { useRef, useState } from "react"
import BubbleStep from "./components/bubble-step"
import CompareStep from "./components/compare-step"
import FactorStep from "./components/factor-step"
import FinanceStep from "./components/finance-step"
import FirstStep from "./components/first-step"
import KLineType from "./components/k-line-step"
import MarketCap from "./components/market-cap"
import MethodStep from "./components/method-step"
import PeriodStep from "./components/period-step"
import StockTable from "./components/stock-table"
import { SuperStockContext } from "./ctx"

enum SuperStockType {
  Tech = 0,
  Basic = 1,
  Super = 2,
}

type StepRegister = Record<string, {
  step: number
  getData: () => any
  validate: (form: any) => boolean
}>

const SuperStock = () => {
  const [type, setType] = useState<SuperStockType>(SuperStockType.Tech)
  const registerRef = useRef<StepRegister>({})
  const [loading, { setFalse, setTrue }] = useBoolean()
  const { data: category } = useQuery({
    queryKey: [getStockCategoryData.cacheKey],
    queryFn: () => getStockCategoryData(),
    placeholderData: {}
  })
  const [data, setData] = useState<Awaited<ReturnType<typeof getStockSelection>>>(JSON.parse(sessionStorage.getItem('stock-picker-list') ?? '[]'))
  const register: SuperStockContext['register'] = (field, step, getData, validate) => {
    for (const key of Object.keys(registerRef.current)) {
      if (registerRef.current[key].step === step) {
        throw new Error(`step ${step} has been registered`)
      }
    }

    registerRef.current[field] = { step, getData, validate }
  }

  const [result, setResult] = useState<{ hasResult: boolean }>({ hasResult: Boolean(sessionStorage.getItem('stock-picker-has')) })

  const unregister: SuperStockContext['unregister'] = (field) => {
    delete registerRef.current[field]
  }

  const { toast } = useToast()

  const onSubmit = async () => {

    if (Object.keys(registerRef.current).some(key => !registerRef.current[key].validate(registerRef.current))) {
      toast({
        description: '选股范围错误'
      })

      return
    }

    const data = Object.keys(registerRef.current).reduce((acc, cur) => {
      acc[cur] = registerRef.current[cur].getData()
      return acc
    }, {} as Record<string, unknown>) as Parameters<typeof getStockSelection>[0]

    data.tab_page = type

    if ((data as any).category_ids_ext.length > 0) {
      data.category_ids = [...data.category_ids, ...(data as any).category_ids_ext]
    }

    setTrue()

    const [err, r] = await to(getStockSelection(data))
    setFalse()

    if (err) {
      toast({
        description: err.message
      })
      return
    }

    if(!r || r.length === 0){
      toast({
        description: '未找到符合条件的股票'
      })
      return
    }

    setData(r)
    sessionStorage.setItem('stock-picker-has', '1')
    sessionStorage.setItem('stock-picker-list', JSON.stringify(r))

    setResult({ hasResult: true })
  }

  const onResetStockPick = () => {
    sessionStorage.removeItem('stock-picker-has')
    sessionStorage.removeItem('stock-picker-list')

    setResult({ hasResult: false })
  }

  return (
    <SuperStockContext.Provider value={{ data: category as unknown as SuperStockContext['data'], register, unregister }} >
      {
        result.hasResult ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden">
              <StockTable data={data} />
            </div>
            <div className="flex flex-shrink-0 relative items-center justify-center pb-4">
              <div className="absolute left-2 top-3 text-sm">
                选股结果：当前共选出 {data?.length} 只股票
              </div>
              <Button className="w-32 mx-auto" onClick={onResetStockPick}>重新选股</Button>
            </div>
          </div>
        ) : (
          <ScrollArea className="bg-muted h-full">
            <div className="w-[1366px] mx-auto ">
              <div className="p-12 box-border ">
                <div className="flex justify-center text-secondary mb-12">
                  <SuperStockTypeTab type={type} onChange={setType} />
                </div>
                {
                  type === SuperStockType.Super && (
                    <div className="mt-8 bg-accent py-1 text-center text-sm">
                      技术面
                    </div>
                  )
                }
                <div>
                  <FirstStep />
                </div>
                {
                  (type === SuperStockType.Tech || type === SuperStockType.Super) && (
                    <>
                      <KLineType />
                      <MethodStep />
                      <FactorStep />
                    </>
                  )
                }
                {
                  type === SuperStockType.Super && (
                    <div className="mt-8 bg-accent py-1 text-center text-sm">
                      基本面
                    </div>
                  )
                }
                {
                  (type === SuperStockType.Basic || type === SuperStockType.Super) && (
                    <>
                      <MarketCap />
                      <FinanceStep />
                      <PeriodStep />
                      <BubbleStep />
                      <CompareStep />
                    </>
                  )
                }
                <div className="text-center mt-12">
                  <Button className="w-24" onClick={onSubmit}>确定</Button>
                </div>
              </div>
              {
                loading && (<div className="fixed left-0 right-0 bottom-0 top-0 bg-background/45 flex items-center justify-center">
                  <div className="w-60 bg-background/95 p-12 flex flex-col items-center">
                    <JknIcon className="w-48 h-48" name="load" />
                    <div className="text-center mt-4">拼命选股中</div>
                  </div>
                </div>
                )
              }
            </div>
          </ScrollArea>
        )
      }
    </SuperStockContext.Provider >
  )
}



interface SuperStockTypeTabProps {
  onChange?: (type: SuperStockType) => void
  type?: SuperStockType
}



const SuperStockTypeTab = (props: SuperStockTypeTabProps) => {
  const _onClick = (type: SuperStockType) => {
    props.onChange?.(type)
  }

  return (
    <div className="super-stock-type">
      <div className={cn(props.type === SuperStockType.Tech && 'super-stock-type-active')} onClick={() => _onClick(SuperStockType.Tech)} onKeyDown={() => { }}>技术面</div>
      <div className={cn(props.type === SuperStockType.Basic && 'super-stock-type-active')} onClick={() => _onClick(SuperStockType.Basic)} onKeyDown={() => { }}>基本面</div>
      <div className={cn(props.type === SuperStockType.Super && 'super-stock-type-active')} onClick={() => _onClick(SuperStockType.Super)} onKeyDown={() => { }}>超级组合</div>

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