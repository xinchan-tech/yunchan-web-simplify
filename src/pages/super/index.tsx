import { getStockCategoryData, getStockSelection } from '@/api'
import { Button, JknIcon, ScrollArea } from '@/components'
import { useToast } from '@/hooks'
import { cn } from '@/utils/style'
import { useQuery } from '@tanstack/react-query'
import { useBoolean } from 'ahooks'
import to from 'await-to-js'
import { useRef, useState } from 'react'
import BubbleStep from './components/bubble-step'
import CompareStep from './components/compare-step'
import FactorStep from './components/factor-step'
import FinanceStep from './components/finance-step'
import FirstStep from './components/first-step'
import KLineType from './components/k-line-step'
import MarketCap from './components/market-cap'
import MethodStep from './components/method-step'
import PeriodStep from './components/period-step'
import StockTable from './components/stock-table'
import { SuperStockContext } from './ctx'

enum SuperStockType {
  Tech = 0,
  Basic = 1,
  Super = 2
}

type StepRegister = Record<
  string,
  {
    step: number
    getData: () => any
    validate: (form: any) => boolean
  }
>

const SuperStock = () => {
  const [type, setType] = useState<SuperStockType>(SuperStockType.Tech)
  const registerRef = useRef<StepRegister>({})
  const [loading, { setFalse, setTrue }] = useBoolean()
  const { data: category } = useQuery({
    queryKey: [getStockCategoryData.cacheKey],
    queryFn: () => getStockCategoryData(),
    placeholderData: {}
  })
  const [data, setData] = useState<Awaited<ReturnType<typeof getStockSelection>>>(
    JSON.parse(sessionStorage.getItem('stock-picker-list') ?? '[]')
  )
  const register: SuperStockContext['register'] = (field, step, getData, validate) => {
    for (const key of Object.keys(registerRef.current)) {
      if (registerRef.current[key].step === step) {
        throw new Error(`step ${step} has been registered`)
      }
    }

    registerRef.current[field] = { step, getData, validate }
  }

  const [result, setResult] = useState<{ hasResult: boolean }>({
    hasResult: Boolean(sessionStorage.getItem('stock-picker-has'))
  })

  const unregister: SuperStockContext['unregister'] = field => {
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

    const data = Object.keys(registerRef.current).reduce(
      (acc, cur) => {
        acc[cur] = registerRef.current[cur].getData()
        return acc
      },
      {} as Record<string, unknown>
    ) as Parameters<typeof getStockSelection>[0]

    data.tab_page = type

    if ((data as any).category_ids_ext.length > 0) {
      data.category_ids = [...data.category_ids, ...(data as any).category_ids_ext]
    }

    (data as any).category_ids_ext = undefined

    setTrue()

    const [err, r] = await to(getStockSelection(data))
    setFalse()

    if (err) {
      toast({
        description: err.message
      })
      return
    }

    if (!r || r.length === 0) {
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
    <div className="h-full w-full flex items-center justify-center bg-background overflow-hidden font-pingfang">
      <SuperStockContext.Provider
        value={{
          data: category as unknown as SuperStockContext['data'],
          register,
          unregister
        }}
      >
        {result.hasResult ? (
          <div className="h-full flex flex-col w-table py-[40px]">
            <div className="flex-1 overflow-hidden">
              <StockTable data={data} />
            </div>
            <div className="flex flex-shrink-0 relative items-center justify-center pb-4">
              <div className="absolute left-2 top-3 text-sm">选股结果：当前共选出 {data?.length} 只股票</div>
              <Button className="w-32 mx-auto" onClick={onResetStockPick}>
                重新选股
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-full w-full">
            <ScrollArea className="h-full w-full">
              <div className="w-page-content mx-auto">
                <div className="flex justify-center mt-3">
                  <SuperStockTypeTab type={type} onChange={setType} />
                </div>
                <div className="px-10 py-5 mb-10">
                  <FirstStep />
                  {(type === SuperStockType.Tech || type === SuperStockType.Super) && (
                    <>
                      <KLineType />
                      <MethodStep />
                      <FactorStep />
                    </>
                  )}
                  {(type === SuperStockType.Basic || type === SuperStockType.Super) && (
                    <>
                      <MarketCap />
                      <FinanceStep />
                      <PeriodStep />
                      <BubbleStep />
                      <CompareStep />
                    </>
                  )}
                </div>
                {loading && (
                  <div className="fixed left-0 right-0 bottom-0 top-0 bg-background/45 flex items-center justify-center">
                    <div className="w-60 bg-background/95 p-12 flex flex-col items-center">
                      <JknIcon className="w-48 h-48" name="load" />
                      <div className="text-center mt-4">拼命选股中</div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="w-page-content mx-auto relative px-10 box-border">
              <div className="absolute right-10 bottom-[10px] items-center justify-end mt-2">
                <Button
                  className="w-32 h-10 rounded-sm bg-[#2962FF] text-[#DBDBDB] hover:opacity-80"
                  onClick={onSubmit}
                >
                  确定
                </Button>
              </div>
            </div>
          </div>
        )}
      </SuperStockContext.Provider>
    </div>
  )
}

interface SuperStockTypeTabProps {
  onChange?: (type: SuperStockType) => void
  type?: SuperStockType
}

const SuperStockTypeTab: React.FC<SuperStockTypeTabProps> = props => {
  /**
   * 处理点击事件
   * @param type 股票分析类型
   */
  const _onClick = (type: SuperStockType) => {
    props.onChange?.(type)
  }

  /**
   * 股票分析类型配置数组
   */
  const stockTypes = [
    {
      type: SuperStockType.Tech,
      label: '技术面'
    }
    // {
    //   type: SuperStockType.Basic,
    //   label: "基本面",
    // },
    // {
    //   type: SuperStockType.Super,
    //   label: "超级组合",
    // },
  ]

  return (
    <div className="flex items-center gap-8 w-full px-10 box-border pb-1 border-x-0 border-t-0 border-b border-solid border-[#2E2E2E]">
      {stockTypes.map(item => (
        <div key={item.label}>
          <div
            key={item.type}
            className={cn(
              'h-[30px] flex items-center cursor-pointer font-[500] text-[#B8B8B8]',
              props.type === item.type && 'text-[#DBDBDB]'
            )}
            onClick={() => _onClick(item.type)}
            onKeyDown={() => {}}
          >
            {item.label}
          </div>
          <div
            className={cn('h-[2px] w-full bg-transparent rounded-[30px]', props.type === item.type && 'bg-[#DBDBDB]')}
          />
        </div>
      ))}
    </div>
  )
}

export default SuperStock
