import { getStockBaseCodeInfo, getStockBrief, getStockNotice, getStockQuote, getStockRelated, getStockTrades, StockChartInterval } from "@/api"
import { AiAlarm, Button, CapsuleTabs, Carousel, CarouselContent, CollectStar, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, HoverCard, HoverCardContent, HoverCardTrigger, JknIcon, JknRcTable, type JknRcTableProps, NumSpan, NumSpanSubscribe, PriceAlarm, ScrollArea, Separator, SubscribeSpan, withTooltip } from "@/components"
import { usePropValue, useStockQuoteSubscribe, useTableData, useTableRowClickToStockTrading } from "@/hooks"
import { useTime } from "@/store"
import { stockUtils } from "@/utils/stock"
import { cn } from "@/utils/style"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import Decimal from "decimal.js"
import Autoplay from "embla-carousel-autoplay"
import { nanoid } from "nanoid"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { kChartUtils, stockBaseCodeInfoExtend, useSymbolQuery } from "../lib"
export const StockInfo = () => {
  const [active, setActive] = useState<'quote' | 'news'>('quote')
  const code = useSymbolQuery()


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

type StockBaseInfoData = {
  name: string
  collect: 0 | 1
  code: string
  percent: number
  close: number
  prevClose: number
  time: string
  subTime: string
  subClose: number
  subPercent: number
  subPrevClose: number
}

const StockBaseInfo = () => {
  const code = useSymbolQuery()
  const trading = useTime(s => s.getTrading())

  const queryOptions = useMemo(() => ({
    queryKey: [getStockBaseCodeInfo.cacheKey, code, stockBaseCodeInfoExtend],
    queryFn: () => getStockBaseCodeInfo({ symbol: code, extend: stockBaseCodeInfoExtend }),
    refetchInterval: 1000 * 60 * 5
  }
  ), [code])
  const queryClient = useQueryClient()

  const codeInfo = useQuery(queryOptions)

  const [data, setData] = useState<StockBaseInfoData>()

  useEffect(() => {
    const [lastData, beforeData, afterData] = codeInfo.data ? stockUtils.toStockRecord(codeInfo.data) : []

    const subData = (trading === 'preMarket' || trading === 'intraDay') ? beforeData : afterData

    setData({
      name: lastData?.name ?? '',
      collect: lastData?.collect ?? 0,
      code: lastData?.code ?? '',
      percent: lastData?.percent ?? 0,
      close: lastData?.close ?? 0,
      prevClose: lastData?.prevClose ?? 0,
      subClose: subData?.close ?? 0,
      subPercent: subData?.percent ?? 0,
      time: lastData?.time ?? '',
      subTime: subData?.time ?? '',
      subPrevClose: subData?.prevClose ?? 0
    })


  }, [codeInfo.data, trading])

  useStockQuoteSubscribe([code])

  const onStarUpdate = useCallback((check: boolean) => {
    queryClient.cancelQueries(queryOptions)

    queryClient.setQueryData(queryOptions.queryKey, {
      ...codeInfo.data,
      extend: {
        ...(codeInfo.data?.extend ?? {}),
        collect: check ? 1 : 0
      }
    })

    queryClient.invalidateQueries(queryOptions)
  }, [queryClient, codeInfo.data, queryOptions])
  return (
    <>
      <div className="flex w-full items-center px-2 box-border py-2 border-0 border-b border-solid border-border">
        <span className="text-lg">{code}</span>
        <span className="flex-1 text-sm text-tertiary mx-2">{data?.name}</span>
        {
          data?.code ? <CollectStar onUpdate={onStarUpdate} checked={data?.collect === 1} sideOffset={5} align="start" code={data.code} /> : null
        }
      </div>
      <div className="mt-1 py-2 border-0 border-b border-solid border-border">
        <StockQuoteBar
          label="点击查看盘中分时走势"
          percent={data?.percent}
          close={data?.close}
          prevClose={data?.prevClose}
          tradingLabel={trading === 'intraDay' ? '交易中' : '收盘价'} time={data?.time}
          side="bottom"
          contentClassName="text-xs"
          interval={StockChartInterval.INTRA_DAY}
        />

        {
          trading !== 'intraDay' ? (trading === 'preMarket' ? (
            <StockQuoteBar
              label="点击查看盘前分时走势"
              percent={data?.subPercent}
              close={data?.subClose}
              prevClose={data?.subPrevClose}
              tradingLabel="盘前价"
              time={data?.subTime}
              side="bottom"
              contentClassName="text-xs"
              interval={StockChartInterval.PRE_MARKET}
            />
          ) : <StockQuoteBar
            label="点击查看盘后分时走势"
            percent={data?.subPercent}
            close={data?.subClose}
            prevClose={data?.subPrevClose}
            tradingLabel="盘后价" time={data?.subTime}
            side="bottom"
            contentClassName="text-xs"
            interval={StockChartInterval.AFTER_HOURS}
          />) : null
        }
      </div>
    </>
  )
}

interface StockQuoteBarProps {
  percent?: number
  close?: number
  prevClose?: number
  tradingLabel?: string
  time?: string
  interval: number
}
const StockQuoteBar = withTooltip(memo((props: StockQuoteBarProps) => {
  const symbol = useSymbolQuery()
  // const trading = useTime(s => s.getTrading())

  const onClick = () => {
    kChartUtils.setTimeIndex({ timeIndex: props.interval })
  }

  const trading = useMemo(() => stockUtils.intervalToTrading(props.interval), [props.interval])

  return (
    <div className={cn('flex items-center justify-between px-2 box-border text-xs my-1 cursor-pointer')} onClick={onClick} onKeyDown={() => { }}>
      <span className={cn('text-base font-bold', props.interval === StockChartInterval.INTRA_DAY && 'text-lg')}>
        <SubscribeSpan.Price symbol={symbol} arrow decimal={3} trading={trading} initDirection={Decimal.create(props?.percent).gt(0)} initValue={props.close} zeroText="--" />
      </span>
      <span>
        <SubscribeSpan.Percent type="amount" symbol={symbol} trading={trading} decimal={3} showSign initDirection={Decimal.create(props?.percent).gt(0)} initValue={(props?.close ?? 0) - (props?.prevClose ?? 0)} zeroText="--" />
      </span>
      <span>
        <SubscribeSpan.Percent symbol={symbol} decimal={2} trading={trading} showSign initDirection={Decimal.create(props?.percent).gt(0)} initValue={props.percent} zeroText="--" />
      </span>
      <span className="text-tertiary">
        {props.tradingLabel}
        <SubscribeSpan
          trading={trading}
          symbol={symbol} value={props.time?.slice(5, 11).replace('-', '/')}
          formatter={v => dayjs(v.record.time * 1000).tz('America/New_York').format('MM/DD')}
        />
      </span>
    </div>
  )
}))


const StockQuote = () => {
  const code = useSymbolQuery()

  const quote = useQuery({
    queryKey: [getStockQuote.cacheKey, code],
    queryFn: () => getStockQuote(code)
  })

  const codeInfo = useQuery({
    queryKey: [getStockBaseCodeInfo.cacheKey, code, stockBaseCodeInfoExtend],
    queryFn: () => getStockBaseCodeInfo({ symbol: code, extend: stockBaseCodeInfoExtend })
  })

  const [stock, _, __] = codeInfo.data ? stockUtils.toStockRecord(codeInfo.data) : []

  const bubble = useMemo(() => {
    const bubble = {
      value: codeInfo.data?.extend?.bubble?.bubble_val ?? 0,
      text: codeInfo.data?.extend?.bubble?.bubble_status ?? ''
    }

    return bubble
  }, [codeInfo.data])

  return (
    <div>
      <div className="mt-1 py-2 grid grid-cols-2 border-0 border-b border-solid border-border text-xs px-2 gap-y-2">
        <div>
          <span className="text-tertiary">最高价&nbsp;&nbsp;</span>
          <span><NumSpan value={quote.data?.q_high} isPositive={Decimal.create(quote.data?.q_high).gte(quote.data?.q_close ?? 0)} /></span>
        </div>
        <div>
          <span className="text-tertiary">今开价&nbsp;&nbsp;</span>
          <span>
            <NumSpan value={quote.data?.q_open} isPositive={Decimal.create(quote.data?.q_open).gte(quote.data?.q_close ?? 0)} />
          </span>
        </div>
        <div>
          <span className="text-tertiary">最低价&nbsp;&nbsp;</span>
          <span>
            <NumSpan value={quote.data?.q_low} isPositive={Decimal.create(quote.data?.q_low).gte(quote.data?.q_close ?? 0)} />
          </span>
        </div>
        <div>
          <span className="text-tertiary">昨收价&nbsp;&nbsp;</span>
          <span>{Decimal.create(quote.data?.q_preday_close).toFixed(3)}</span>
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
          <span>{Decimal.create(stock?.marketValue).toShortCN(3)}</span>
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
          <span>
            <NumSpan value={quote.data?.q_year_high} isPositive={Decimal.create(quote.data?.q_year_high).gte(quote.data?.q_close ?? 0)} />
          </span>
        </div>
        <div>
          <span className="text-tertiary">52周低&nbsp;&nbsp;</span>
          <span>
            <NumSpan value={quote.data?.q_year_low} isPositive={Decimal.create(quote.data?.q_year_low).gte(quote.data?.q_close ?? 0)} />
          </span>
        </div>
      </div>
      {
        +bubble.value !== 0 ? (
          <div className="flex h-12">
            <div className="w-1/2 flex items-center justify-center border-0 border-r border-b border-solid border-border text-stock-green h-full">估值泡沫</div>
            <div className="w-1/2 flex items-center justify-center border-0 border-b border-solid border-border text-stock-green h-full">
              <span className={cn(Decimal.create(bubble.value).gt(1) ? 'text-stock-down': 'text-stock-up')}>{Decimal.create(bubble.value).toFixed(2)}({bubble.text})</span>
            </div>
          </div>
        ) : null
      }
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
    <>
      {
        newList.data ? (<div className="flex p-2 w-full box-border">
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
        </div>) : null
      }
    </>
  )
}

type TableDataType = {
  symbol: string,
  name: string,
  close: number,
  percent?: number,
  marketValue?: number,
}

const StockRelated = () => {
  const code = useSymbolQuery()
  const [plates, setPlates] = useState<{ id: string, name: string }[]>([])
  const [plateId, setPlateId] = useState<string>()
  const [menuType, setMenuType] = useState<'plates' | 'trades'>('plates')
  const relates = useQuery({
    queryKey: [getStockRelated.cacheKey, code, ['total_share'], (plateId === undefined || plateId === plates[0]?.id) ? undefined : plateId],
    queryFn: () => getStockRelated({ symbol: code, plate_id: plateId, extend: ['total_share'] }),
    enabled: menuType === 'plates'
  })

  const trades = useQuery({
    queryKey: [getStockTrades.cacheKey, code],
    queryFn: () => getStockTrades(code),
    enabled: menuType === 'trades'
  })

  useEffect(() => {
    if (relates.data?.plates && relates.data?.plates.length > 0) {
      setPlates(relates.data?.plates)
      setPlateId(relates.data?.plates[0].id)
    }
  }, [relates.data?.plates])

  const [list, { setList, onSort }] = useTableData<TableDataType>([], 'symbol')

  useEffect(() => {
    if (!relates.data) {
      setList([])
      return
    }

    setList(relates.data?.stocks.map(item => {
      return stockUtils.toStockWithExt(item.stock, { extend: item.extend, symbol: item.symbol, name: item.name })
    }))
  }, [relates.data, setList])

  const columns = useMemo<JknRcTableProps['columns']>(() => [
    {
      title: '股票', dataIndex: 'symbol', width: '22%', sort: true, align: 'left',
      render: (symbol) => <span className="text-xs leading-8 my-1 inline-block">{symbol}</span>
    },
    {
      title: '现价', dataIndex: 'close', align: 'right', width: '24%', sort: true,
      render: (close, row) => (
        <NumSpanSubscribe className="text-xs" code={row.symbol} field="close" blink value={close} isPositive={Decimal.create(row.price).gte(0)} align="right" />
      )
    },
    {
      title: '涨跌幅%', dataIndex: 'percent', align: 'right', width: '29%', sort: true,
      render: (percent, row) => (
        <NumSpanSubscribe className="text-xs" code={row.symbol} field="percent" blink block decimal={2} value={percent} percent isPositive={Decimal.create(row.percent).gte(0)} symbol align="right" />
      )
    },
    {
      title: '总市值', dataIndex: 'marketValue', align: 'right', width: '25%', sort: true,
      render: (marketValue, row) => (
        <NumSpanSubscribe className="text-xs" code={row.symbol} field={v => stockUtils.getSubscribeMarketValue(row, v)} blink align="right" unit decimal={2} value={marketValue} />
      )
    }

  ], [])

  const tradesBySort = useMemo(() => {
    return trades.data?.sort((a, b) => {
      return dayjs(a.t).valueOf() - dayjs(b.t).valueOf()
    })
  }, [trades.data])

  const onRowClick = useTableRowClickToStockTrading('symbol')

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
        {/* <div onClick={() => setMenuType('trades')} onKeyDown={() => { }}>
          <span className={cn(
            'text-xs cursor-pointer',
            menuType === 'trades' && 'text-primary'
          )}>逐笔交易</span>
        </div> */}
      </div>
      <div className="flex-1 overflow-hidden">
        {
          menuType === 'plates' ? (
            <JknRcTable isLoading={relates.isLoading} rowKey="symbol" data={list} columns={columns} onSort={onSort as any} onRow={onRowClick} />
          ) : (
            <ScrollArea className="flex flex-col text-xs space-y-2 px-2 h-full">
              {
                tradesBySort?.map((item) => (
                  <div key={nanoid()} className="flex items-center">
                    <span className="flex-1">{item.t.slice(11)}</span>
                    <span className="text-stock-down text-right flex-1">{item.v}</span>
                    <span className="text-stock-down text-right flex-1">{item.p}</span>
                  </div>
                ))
              }
            </ScrollArea>
          )
        }
      </div>
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