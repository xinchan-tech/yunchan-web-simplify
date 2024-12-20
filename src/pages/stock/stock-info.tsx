import { type StockExtend, getStockBaseCodeInfo, getStockBrief, getStockNotice, getStockQuote, getStockRelated, getStockTrades } from "@/api"
import { AiAlarm, Button, CapsuleTabs, Carousel, CarouselContent, CollectStar, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, HoverCard, HoverCardContent, HoverCardTrigger, JknIcon, JknTable, type JknTableProps, NumSpan, PriceAlarm, ScrollArea, Separator } from "@/components"
import { useQueryParams } from "@/hooks"
import { numToFixed, priceToCnUnit } from "@/utils/price"
import { StockRecord, stockManager } from "@/utils/stock"
import { cn } from "@/utils/style"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import Decimal from "decimal.js"
import Autoplay from "embla-carousel-autoplay"
import { nanoid } from "nanoid"
import { useEffect, useMemo, useState } from "react"
import { useSymbolQuery } from "./lib"
export const StockInfo = () => {
  const [active, setActive] = useState<'quote' | 'news'>('quote')
  const queryParams = useQueryParams()
  const code = queryParams.get('symbol') ?? 'QQQ'


  return (
    <div className="border border-solid border-border h-full flex flex-col overflow-hidden">
      <div className="p-1 border-0 border-b border-solid border-border">
        <CapsuleTabs activeKey={active} onChange={setActive as (v: string) => void}>
          <CapsuleTabs.Tab className="flex-1 text-center" label="报价" value="quote" />
          <CapsuleTabs.Tab className="flex-1 text-center" label="简介" value="news" />
        </CapsuleTabs>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <StockBaseInfo />
        {
          active === 'quote' ? (
            <>
              <StockQuote />
              <div className="flex w-full">
                <div className="text-[#ff0075] py-8 flex-1 flex flex-col items-center border-0 border-r border-b border-solid border-border">
                  <PriceAlarm code={code} >
                    <div className="mt-1">
                      <JknIcon name="ic_price_call" className="w-10 h-10" />
                      <div>股价报警</div>
                    </div>
                  </PriceAlarm>
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
              <Separator />
              <StockRelated />
            </>
          ) : <StockBrief />
        }
      </div>
    </div>
  )
}

const StockBaseInfo = () => {
  const code = useSymbolQuery()
  const queryOptions = {
    queryKey: [getStockBaseCodeInfo.cacheKey, code, extend],
    queryFn: () => getStockBaseCodeInfo({ symbol: code, extend })
  }
  const queryClient = useQueryClient()

  const codeInfo = useQuery(queryOptions)

  const [lastData, _, afterData] = codeInfo.data ? stockManager.toStockRecord(codeInfo.data) : []

  const onStarUpdate = (check: boolean) => {
    queryClient.cancelQueries(queryOptions)

    queryClient.setQueryData(queryOptions.queryKey, {
      ...codeInfo.data,
      extend: {
        ...(codeInfo.data?.extend ?? {}),
        collect: check ? 1 : 0
      }
    })

    queryClient.invalidateQueries(queryOptions)
  }

  return (
    <>
      <div className="flex w-full items-center px-2 box-border py-2 border-0 border-b border-solid border-border">
        <span className="text-lg">{code}</span>
        <span className="flex-1 text-sm text-tertiary mx-2">{lastData?.name}</span>
        {
          lastData?.code ? <CollectStar onUpdate={onStarUpdate} checked={lastData?.collect === 1} code={lastData.code} /> : null
        }
      </div>
      <div className="mt-1 py-2 border-0 border-b border-solid border-border">
        <div className={cn(
          (lastData?.percent ?? 0) >= 0 ? 'text-stock-up' : 'text-stock-down',
          'flex items-center justify-between px-2 box-border text-xs'
        )}>
          <span className="text-lg font-bold">
            <NumSpan arrow decimal={3} isPositive={Decimal.create(lastData?.percent).gte(0)} value={Decimal.create(lastData?.close).toNumber()} />
          </span>
          <span>
            <NumSpan decimal={3} symbol isPositive={Decimal.create(lastData?.percent).gte(0)} value={(lastData?.close ?? 0) - (lastData?.prevClose ?? 0)} />
          </span>
          <span>
            {numToFixed((lastData?.percent ?? 0) * 100, 2)}%
          </span>
          <span className="text-tertiary">
            收盘价
            {lastData?.time.slice(5, 11).replace('-', '/')}
          </span>
        </div>
        <div className={cn(
          (afterData?.percent ?? 0) >= 0 ? 'text-stock-up' : 'text-stock-down',
          'flex items-center justify-between px-2 box-border text-xs my-1'
        )}>
          <span className="text-base font-bold">
            <NumSpan arrow decimal={3} isPositive={Decimal.create(afterData?.percent).gte(0)} value={Decimal.create(afterData?.close).toNumber()} />
          </span>
          <span>
            <NumSpan decimal={3} symbol isPositive={Decimal.create(afterData?.percent).gte(0)} value={(afterData?.close ?? 0) - (afterData?.prevClose ?? 0)} />
          </span>
          <span>{numToFixed((afterData?.percent ?? 0) * 100, 2)}%</span>
          <span className="text-tertiary">
            盘后价
            {lastData?.time.slice(5, 11).replace('-', '/')}
          </span>
        </div>
      </div>
    </>
  )
}

const extend: StockExtend[] = ['collect', 'alarm_ai', 'alarm_all', 'day_basic', 'total_share', 'financials', 'bubble', 'stock_before', 'stock_after']



const StockQuote = () => {
  const code = useSymbolQuery()

  const quote = useQuery({
    queryKey: [getStockQuote.cacheKey, code],
    queryFn: () => getStockQuote(code)
  })

  const codeInfo = useQuery({
    queryKey: [getStockBaseCodeInfo.cacheKey, code, extend],
    queryFn: () => getStockBaseCodeInfo({ symbol: code, extend })
  })

  const [stock, _, __] = codeInfo.data ? stockManager.toStockRecord(codeInfo.data) : []





  return (
    <div>
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
          <span>{priceToCnUnit(+(stock?.marketValue ?? '0'))}</span>
        </div>
        <div>
          <span className="text-tertiary">换手率&nbsp;&nbsp;</span>
          <span>{Decimal.create(stock?.turnOverRate).mul(100).toFixed(2)}%</span>
        </div>
        <div>
          <span className="text-tertiary">市盈率&nbsp;&nbsp;</span>
          <span>{stock?.pe ? Decimal.create(stock.pe).toFixed(2) : '--'}</span>
        </div>
        <div>
          <span className="text-tertiary">市净率&nbsp;&nbsp;</span>
          <span>{stock?.pb ? Decimal.create(stock.pb).toFixed(2) : '--'}</span>
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
    <div className="flex p-2 w-full box-border">
      <HoverCard openDelay={100}>
        <HoverCardTrigger >
          <JknIcon name="ic_notice" className="mr-2 mt-0.5" />
        </HoverCardTrigger>
        <HoverCardContent side="left" align="start" className="w-80 p-0">
          <ScrollArea className="h-96">
            <div className="">
              {
                newList.data?.event.map((item) => (
                  <div key={nanoid()} className={cn(
                    'flex-grow-0 flex-shrink-0 basis-full text-xs hover:bg-primary cursor-pointer'
                  )}
                    onClick={() => item.url && window.open(item.url)}
                    onKeyDown={() => { }}
                  >
                    <div className="flex p-2 w-full box-border">
                      <JknIcon name="ic_notice" className="mr-2 mt-0.5" />
                      {
                        <span className="text-sm">{item.title}</span>
                      }
                    </div>
                    <Separator />
                  </div>
                ))
              }
            </div>
          </ScrollArea>
        </HoverCardContent>
      </HoverCard>
      <div className="flex-1">
        <Carousel plugins={[Autoplay({
          delay: 1000 * 5,
        })]} orientation="vertical">
          <CarouselContent className="h-12" >
            {
              newList.data?.event.map((item) => (
                <div key={nanoid()} className="flex-grow-0 flex-shrink-0 basis-full">
                  {
                    <span className="text-sm">{item.title}</span>
                  }
                </div>
              ))
            }
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  )
}


const StockRelated = () => {
  const code = useSymbolQuery()
  const [plates, setPlates] = useState<{ id: string, name: string }[]>([])
  const [plateId, setPlateId] = useState<string>()
  const [menuType, setMenuType] = useState<'plates' | 'trades'>('plates')
  const relates = useQuery({
    queryKey: [getStockRelated.cacheKey, code, plateId, ['total_share']],
    queryFn: () => getStockRelated({ symbol: code, plate_id: plateId, extend: ['total_share'] }),
    enabled: menuType === 'plates'
  })

  const trades = useQuery({
    queryKey: [getStockTrades.cacheKey, code],
    queryFn: () => getStockTrades(code),
    enabled: menuType === 'trades'
  })

  useEffect(() => {
    if (relates.data?.plates) {
      setPlates(relates.data?.plates)
    }
  }, [relates.data?.plates])

  const data = relates.data?.stocks.map(item => {
    const [stock] = StockRecord.create(item)

    return {
      symbol: item.symbol,
      name: item.name,
      price: stock?.close,
      percent: stock?.percent,
      amount: stock?.marketValue
    }
  }) ?? []

  const columns = useMemo<JknTableProps['columns']>(() => [
    {
      header: '股票', accessorKey: 'symbol', meta: { width: '22%' }, enableSorting: false,
      cell: ({ row }) => <span className="text-xs">{row.getValue('symbol')}</span>
    },
    {
      header: '现价', accessorKey: 'price', meta: { align: 'right', width: '24%' },
      cell: ({ row }) => (
        <NumSpan className="text-xs" value={Decimal.create(row.getValue<number>('price')).toNumber()} isPositive={Decimal.create(row.getValue<number>('percent')).gte(0)} />
      )
    },
    {
      header: '涨跌幅%', accessorKey: 'percent', meta: { align: 'right', width: '30%' },
      cell: ({ row }) => (
        <NumSpan className="text-xs" block decimal={2} value={Decimal.create(row.getValue<number>('percent')).mul(100).toNumber()} isPositive={Decimal.create(row.getValue<number>('percent')).gte(0)} symbol percent />
      )
    },
    {
      header: '总市值', accessorKey: 'amount', meta: { align: 'right', width: '24%' },
      cell: ({ row }) => (
        <NumSpan className="text-xs" decimal={2} value={Decimal.create(row.getValue<number>('amount')).toNumber()} unit />
      )
    }

  ], [])

  const tradesBySort = useMemo(() => {
    return trades.data?.sort((a, b) => {
      return dayjs(a.t).valueOf() - dayjs(b.t).valueOf()
    })
  }, [trades.data])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex justify-around items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button reset onClick={() => setMenuType('plates')}>
              <span className="text-xs font-normal">
                {
                  plates?.find((item) => item.id === plateId)?.name ?
                    <span className={cn(menuType === 'plates' && 'text-primary')}>{plates?.find((item) => item.id === plateId)?.name}</span>
                    : '相关股票'
                }
              </span>
              <JknIcon name="arrow_down" className="ml-1 w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {
              plates?.map((item) => (
                <DropdownMenuItem onClick={() => { setPlateId(item.id); setMenuType('plates') }} key={item.id}>{item.name}</DropdownMenuItem>
              ))
            }
          </DropdownMenuContent>
        </DropdownMenu>
        <div onClick={() => setMenuType('trades')} onKeyDown={() => { }}>
          <span className={cn(
            'text-xs cursor-pointer',
            menuType === 'trades' && 'text-primary'
          )}>逐笔交易</span>
        </div>
      </div>
      <ScrollArea className="flex-1">
        {
          menuType === 'plates' ? (
            <JknTable rowKey="symbol" data={data} columns={columns} />
          ) : (
            <div className="flex flex-col text-xs space-y-2 px-2">
              {
                tradesBySort?.map((item) => (
                  <div key={nanoid()} className="flex items-center">
                    <span className="flex-1">{item.t.slice(11)}</span>
                    <span className="text-stock-down text-right flex-1">{item.v}</span>
                    <span className="text-stock-down text-right flex-1">{item.p}</span>
                  </div>
                ))
              }
            </div>
          )
        }
      </ScrollArea>
    </div>
  )
}

/**
 * 股票简介
 */
const StockBrief = () => {
  const code = useSymbolQuery()

  const { data: brief } = useQuery({
    queryKey: [getStockBrief.cacheKey, code],
    queryFn: () => getStockBrief(code)
  })

  return (
    <div className="text-secondary text-sm py-4 space-y-4">
      <div className="text-sm px-2">概况</div>
      <div className="flex items-center px-2 w-full overflow-hidden">
        <span className="w-16 flex-shrink-0">公司名称</span>
        <span className="text-foreground">{brief?.name ?? '-'}</span>
      </div>
      <div className="flex items-center px-2 w-full overflow-hidden">
        <span className="w-16 flex-shrink-0">所属行业</span>
        <span className="text-foreground">{brief?.sic_description ?? '-'}</span>
      </div>
      <div className="flex items-center px-2 w-full overflow-hidden">
        <span className="w-16 flex-shrink-0">成立时间</span>
        <span className="text-foreground">{brief?.list_date ?? '-'}</span>
      </div>
      <div className="flex items-center px-2 w-full overflow-hidden">
        <span className="w-16 flex-shrink-0">员工人数</span>
        <span className="text-foreground">{brief?.total_employees ?? '-'}</span>
      </div>
      <div className="flex items-center px-2 w-full overflow-hidden">
        <span className="w-16 flex-shrink-0">公司网站</span>
        <span className="text-foreground">{brief?.homepage_url ?? '-'}</span>
      </div>
      <div className="flex items-center px-2 w-full overflow-hidden">
        <span className="w-16 flex-shrink-0">联系电话</span>
        <span className="text-foreground">{brief?.phone_number ?? '-'}</span>
      </div>
      <div className="flex items-center px-2 w-full overflow-hidden">
        <span className="w-16 flex-shrink-0">证券类型</span>
        <span className="text-foreground">{brief?.market ?? '-'}</span>
      </div>
      <Separator />
      <div className="text-sm px-2">简介</div>
      <div className="text-foreground px-2">{brief?.description ?? '-'}</div>
    </div>
  )
}