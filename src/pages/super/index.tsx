import { cn } from "@/utils/style"
import { useRef, useState } from "react"
import FirstStep from "./components/first-step"
import KLineType from "./components/k-line-step"
import { Button, Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, JknIcon, ScrollArea } from "@/components"
import { getStockCategoryData, getStockSelection } from "@/api"
import { useQuery } from "@tanstack/react-query"
import { SuperStockContext } from "./ctx"
import MethodStep from "./components/method-step"
import FactorStep from "./components/factor-step"
import MarketCap from "./components/market-cap"
import BubbleStep from "./components/bubble-step"
import FinanceStep from "./components/finance-step"
import PeriodStep from "./components/period-step"
import CompareStep from "./components/compare-step"
import { useToast } from "@/hooks"
import { useBoolean } from "ahooks"
import to from "await-to-js"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import StockTable from "./components/stock-table"

enum SuperStockType {
  Tech = 0,
  Basic = 1,
  Super = 2,
}

type StepRegister = Record<string, {
  step: number
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  getData: () => any
  validate: () => boolean
}>

const SuperStock = () => {
  const [type, setType] = useState<SuperStockType>(SuperStockType.Tech)
  const registerRef = useRef<StepRegister>({})
  const [loading, { setFalse, setTrue }] = useBoolean()
  const [drawerOpen, { setFalse: setDrawerClose, setTrue: setDrawerOpen }] = useBoolean()
  const { data: category } = useQuery({
    queryKey: [getStockCategoryData.cacheKey],
    queryFn: () => getStockCategoryData(),
    placeholderData: {}
  })
  const [data, setData] = useState<Awaited<ReturnType<typeof getStockSelection>>>([])
  const register: SuperStockContext['register'] = (field, step, getData, validate) => {
    for (const key of Object.keys(registerRef.current)) {
      if (registerRef.current[key].step === step) {
        throw new Error(`step ${step} has been registered`)
      }
    }

    registerRef.current[field] = { step, getData, validate }
  }

  const unregister: SuperStockContext['unregister'] = (field) => {
    delete registerRef.current[field]
  }

  const { toast } = useToast()

  const onSubmit = async () => {

    if (Object.keys(registerRef.current).some(key => !registerRef.current[key].validate())) {
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

    setTrue()

    const [err, r] = await to(getStockSelection(data))
    setFalse()

    if (err) {
      toast({
        description: err.message
      })
      return
    }
    setData(r)
    setDrawerOpen()
  }

  const onUpdate = async () => {
    const data = Object.keys(registerRef.current).reduce((acc, cur) => {
      acc[cur] = registerRef.current[cur].getData()
      return acc
    }, {} as Record<string, unknown>) as Parameters<typeof getStockSelection>[0]

    data.tab_page = type

    const [err, r] = await to(getStockSelection(data))

    if (!err) {
      setData(r)
    }

  }

  return (
    <SuperStockContext.Provider value={{ data: category as unknown as SuperStockContext['data'], register, unregister }} >
      <ScrollArea className="bg-muted h-full">
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
                <BubbleStep />
                <FinanceStep />
                <PeriodStep />
                <CompareStep />
              </>
            )
          }
          <div className="text-center mt-12">
            <Button className="w-24" onClick={onSubmit}>确定</Button>
          </div>
        </div>
        {
          loading && (<div className="fixed w-screen h-screen top-0 bg-background/45 flex items-center justify-center">
            <div className="w-60 bg-background/95 p-12 flex flex-col items-center">
              <JknIcon className="w-48 h-48" name="load" />
              <div className="text-center mt-4">拼命选股中</div>
            </div>
          </div>
          )
        }
        <Drawer open={drawerOpen} onOpenChange={v => !v && setDrawerClose()}>
          <DrawerContent className="h-[95vh]">
            <VisuallyHidden>
              <DrawerHeader className="text-left">
              </DrawerHeader>
            </VisuallyHidden>
            <ScrollArea className="h-full overflow-hidden">
              <StockTable data={data} onUpdate={onUpdate} />
            </ScrollArea>
            <DrawerFooter className="pt-2">
              <DrawerClose asChild>
                <Button className="w-32 mx-auto">重新选股</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </ScrollArea>
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