import { getStockBaseCodeInfo, getStockBrief, getStockNewsList, getStockNotice, getStockQuote, type StockExtend } from "@/api"
import { AiAlarm, CapsuleTabs, CollectStar, JknIcon, Popover } from "@/components"
import { useQueryParams, useSubscribe } from "@/hooks"
import { numToFixed } from "@/utils/price"
import { stockManager } from "@/utils/stock"
import { cn } from "@/utils/style"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMount } from "ahooks"
import dayjs from "dayjs"
import { useCallback, useEffect, useMemo } from "react"

const useSymbolQuery = () => {
  const queryParams = useQueryParams()

  return queryParams.get('symbol') ?? 'QQQ'
}
export const StockInfo = () => {
  const queryParams = useQueryParams()
  const code = queryParams.get('symbol') ?? 'QQQ'

  // const brief = useQuery({
  //   queryKey: [getStockBrief.cacheKey, code],
  //   queryFn: () => getStockBrief(code)
  // })

  return (
    <div className="border border-solid border-border">
      <div className="p-1 border-0 border-b border-solid border-border">
        <CapsuleTabs activeKey="quote">
          <CapsuleTabs.Tab className="flex-1 text-center" label="报价" value="quote" />
          <CapsuleTabs.Tab className="flex-1 text-center" label="简介" value="news" />
        </CapsuleTabs>
      </div>
      <div>
        <StockQuote />
        <div className="flex w-full">
          <div className="text-[#ff0075] py-8 flex-1 flex flex-col items-center border-0 border-r border-b border-solid border-border">
            <AiAlarm code={code} >
              <div className="mt-1">
                <JknIcon name="ic_price_call" className="w-10 h-10" />
                <div>股价报警</div>
              </div>
            </AiAlarm>
          </div>
          <div className="text-[#ff0075] py-8 flex-1 flex flex-col items-center border-0 border-b border-solid border-border">
            <AiAlarm code={code} >
              <div className="mt-1">
                <JknIcon name="ai_call" className="w-10 h-10" />
                <div>AI报警</div>
              </div>
            </AiAlarm>
          </div>
        </div>
        <StockNews />
      </div>
    </div>
  )
}


const extend: StockExtend[] = ['collect', 'alarm_ai', 'alarm_all', 'day_basic', 'total_share', 'financials', 'bubble', 'stock_before', 'stock_after']

const StockQuote = () => {
  const code = useSymbolQuery()
  const queryClient = useQueryClient()

  const quote = useQuery({
    queryKey: [getStockQuote.cacheKey, code],
    queryFn: () => getStockQuote(code)
  })

  const codeInfo = useQuery({
    queryKey: [getStockBaseCodeInfo.cacheKey, code, extend],
    queryFn: () => getStockBaseCodeInfo({ symbol: code, extend })
  })


  const onSubscribe = useCallback((data) => {
    console.log(data)
  }, [])

  useSubscribe(codeInfo.data?.symbol ?? '', onSubscribe)

  const [lastData, _, afterData] = codeInfo.data ? stockManager.toStockRecord(codeInfo.data) : []

  return (
    <div>
      <div className="">
        <div className="flex w-full items-center px-2 box-border py-2 border-0 border-b border-solid border-border">
          <span className="text-lg">{lastData?.code}</span>
          <span className="flex-1 text-sm text-tertiary mx-2">{lastData?.name}</span>
          {
            lastData?.code ? <CollectStar checked={lastData?.collect === 1} code={lastData.code} /> : null
          }
        </div>
        <div className="mt-1 py-2 border-0 border-b border-solid border-border">
          <div className={cn(
            (lastData?.percent ?? 0) >= 0 ? 'text-stock-up' : 'text-stock-down',
            'flex items-center justify-between px-2 box-border text-xs'
          )}>
            <span className="text-lg font-bold">
              <span>{numToFixed(lastData?.close, 3)}</span>
              <JknIcon className="w-4 h-4 -mb-0.5" name={(lastData?.percent ?? 0) >= 0 ? 'ic_price_up_green' : 'ic_price_down_red'} />
            </span>
            <span>
              {numToFixed((lastData?.close ?? 0) - (lastData?.prevClose ?? 0), 3)}
            </span>
            <span>{numToFixed((lastData?.percent ?? 0) * 100, 2)}%</span>
            <span className="text-tertiary">
              收盘价
              {lastData?.time.slice(5, 11).replace('-', '/')}
            </span>
          </div>
          <div className={cn(
            (lastData?.percent ?? 0) >= 0 ? 'text-stock-up' : 'text-stock-down',
            'flex items-center justify-between px-2 box-border text-xs my-1'
          )}>
            <span className="text-base font-bold">
              <span>{numToFixed(afterData?.close, 3)}</span>
              <JknIcon className="w-4 h-4 -mb-0.5" name={(lastData?.percent ?? 0) >= 0 ? 'ic_price_up_green' : 'ic_price_down_red'} />
            </span>
            <span>
              {numToFixed((afterData?.close ?? 0) - (afterData?.prevClose ?? 0), 3)}
            </span>
            <span>{numToFixed((afterData?.percent ?? 0) * 100, 2)}%</span>
            <span className="text-tertiary">
              盘后价
              {lastData?.time.slice(5, 11).replace('-', '/')}
            </span>
          </div>
        </div>

        <div className="mt-1 py-2 grid grid-cols-2 border-0 border-b border-solid border-border text-xs px-2 gap-y-2">
          <div>
            <span className="text-tertiary">最高价&nbsp;&nbsp;</span>
            <span>{numToFixed(+(quote.data?.q_high ?? '0'))}</span>
          </div>
          <div>
            <span className="text-tertiary">今开价&nbsp;&nbsp;</span>
            <span>{numToFixed(+(quote.data?.q_open ?? '0'))}</span>
          </div>
          <div>
            <span className="text-tertiary">最低价&nbsp;&nbsp;</span>
            <span>{numToFixed(+(quote.data?.q_low ?? '0'))}</span>
          </div>
          <div>
            <span className="text-tertiary">昨收价&nbsp;&nbsp;</span>
            <span>{numToFixed(+(quote.data?.q_preday_close ?? '0'))}</span>
          </div>
          <div>
            <span className="text-tertiary">成交量&nbsp;&nbsp;</span>
            <span>{quote.data?.volume}</span>
          </div>
          <div>
            <span className="text-tertiary">成交额&nbsp;&nbsp;</span>
            <span>{quote.data?.amount}</span>
          </div>
          <div>
            <span className="text-tertiary">总市值&nbsp;&nbsp;</span>
            <span>{numToFixed(+(quote.data?.market_cap ?? '0'))}</span>
          </div>
          <div>
            <span className="text-tertiary">换手率&nbsp;&nbsp;</span>
            <span>{ }</span>
          </div>
          <div>
            <span className="text-tertiary">市盈率&nbsp;&nbsp;</span>
            <span>{ }</span>
          </div>
          <div>
            <span className="text-tertiary">市净率&nbsp;&nbsp;</span>
            <span>{ }</span>
          </div>
          <div>
            <span className="text-tertiary">52周高&nbsp;&nbsp;</span>
            <span>{numToFixed(+(quote.data?.q_year_high ?? '0'))}</span>
          </div>
          <div>
            <span className="text-tertiary">52周低&nbsp;&nbsp;</span>
            <span>{numToFixed(+(quote.data?.q_year_low ?? '0'))}</span>
          </div>
        </div>
      </div>
    </div >
  )
}


const StockNews = () => {
  const code = useSymbolQuery()
  const newList = useQuery({
    queryKey: [getStockNotice.cacheKey, code],
    queryFn: () => getStockNotice(code)
  })


  
  return (
    <div>

    </div>
  )
}