import {
  StockChartInterval,
  getStockBaseCodeInfo,
  // getStockBrief,
  getStockCollects,
  getStockNotice,
  // getStockQuote,
  getStockRelated,
  getStockTrades
} from '@/api'
import {
  Button,
  Carousel,
  CarouselContent,
  CollectDropdownMenu,
  CollectStar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  JknIcon,
  JknRcTable,
  type JknRcTableProps,
  ScrollArea,
  Separator,
  StockView,
  SubscribeSpan,
  withTooltip
} from '@/components'
import {
  usePropValue,
  useSnapshot,
  useSnapshotOnce,
  useStockQuoteSubscribe,
  useTableData,
  useTableRowClickToStockTrading
} from '@/hooks'
import { useTime, useToken } from '@/store'
import { dateUtils } from '@/utils/date'
import { type StockSubscribeHandler, stockUtils } from '@/utils/stock'
import { cn } from '@/utils/style'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import Autoplay from 'embla-carousel-autoplay'
import { nanoid } from 'nanoid'
import type { TableProps } from 'rc-table'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { chartManage, stockBaseCodeInfoExtend, useSymbolQuery } from '../lib'
import { listify } from "radash"
import { useNavigate } from "react-router"

const StockInfo = () => {
  return (
    <div className="h-full flex flex-col overflow-hidden rounded-xs ml-1">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-background rounded overflow-hidden flex-shrink-0 pb-1">
          <StockBaseInfo />
          <StockQuote />
          <StockNews />
        </div>
        <div className="flex-1 overflow-hidden mt-1">
          <GoldenStockPool />
        </div>
        <div className="flex-1 overflow-hidden mt-1">
          <StockRelated />
        </div>
      </div>
    </div>
  )
}

export default StockInfo

type StockBaseInfoData = Parameters<StockSubscribeHandler<'snapshot'>>[0]['data']

const StockBaseInfo = () => {
  const code = useSymbolQuery()
  const trading = useTime(s => s.getTrading())
  // const [dataTrading, setDataTrading] = useState<Nullable<string>>(undefined)

  const [dataInfo, setDataInfo] = useState<Nullable<StockBaseInfoData>>()

  const queryOptions = useMemo(
    () => ({
      queryKey: [getStockBaseCodeInfo.cacheKey, code, stockBaseCodeInfoExtend],
      queryFn: () => getStockBaseCodeInfo({ symbol: code, extend: stockBaseCodeInfoExtend }),
      refetchInterval: 1000 * 60 * 5
    }),
    [code]
  )

  useSnapshotOnce(
    code,
    useCallback(e => {
      setDataInfo(e.data)
    }, [])
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setDataInfo({
      close: 0,
      prevClose: 0,
      dayUpdated: 0,
      extPrice: 0,
      extUpdated: 0
    } as any)
  }, [code])

  const queryClient = useQueryClient()

  const codeInfo = useQuery(queryOptions)

  useStockQuoteSubscribe([code])

  const onStarUpdate = useCallback(
    (check: boolean) => {
      queryClient.cancelQueries(queryOptions)

      queryClient.setQueryData(queryOptions.queryKey, {
        ...codeInfo.data,
        extend: {
          ...(codeInfo.data?.extend ?? {}),
          collect: check ? 1 : 0
        }
      })

      queryClient.invalidateQueries(queryOptions)
    },
    [queryClient, codeInfo.data, queryOptions]
  )

  return (
    <>
      <div className="flex w-full items-center px-2 box-border pt-2 bg-background ">
        {/* <span className="text-lg">{code}</span>
        <span className="flex-1 text-sm text-tertiary mx-2">{data?.name}</span> */}
        <span className="flex items-center w-full overflow-hidden">
          <JknIcon.Stock symbol={code} />
          <span className="text-lg">{code}</span>
          &nbsp;
          <span className="text-tertiary text-xs flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {codeInfo.data?.name}
          </span>
        </span>
        {codeInfo.data?.symbol ? (
          <CollectStar
            onUpdate={onStarUpdate}
            checked={codeInfo.data?.extend?.collect === 1}
            sideOffset={5}
            align="start"
            code={code}
            size={20}
          />
        ) : null}
      </div>
      <div className="py-1 space-y-3 bg-background">
        <StockQuoteBar
          label="点击查看盘中分时走势"
          percent={dataInfo ? stockUtils.getPercent(dataInfo) : undefined}
          close={dataInfo?.close}
          prevClose={dataInfo?.prevClose}
          tradingLabel={trading === 'intraDay' ? '交易中' : '收盘价'}
          time={dateUtils.toUsDay(dataInfo?.dayUpdated ?? '0').format('MM/DD HH:mm')}
          side="bottom"
          contentClassName="text-xs"
          interval={StockChartInterval.INTRA_DAY}
        />

        {trading !== 'intraDay' ? (
          trading === 'preMarket' ? (
            <StockQuoteBar
              label="点击查看分时走势"
              percent={
                dataInfo ? stockUtils.getPercent({ close: dataInfo.extPrice, prevClose: dataInfo.close }) : undefined
              }
              close={dataInfo?.extPrice}
              prevClose={dataInfo?.close}
              time={dateUtils.toUsDay(dataInfo?.extUpdated ?? '0').format('MM/DD HH:mm')}
              tradingLabel="盘前价"
              side="bottom"
              contentClassName="text-xs"
              interval={StockChartInterval.PRE_MARKET}
            />
          ) : (
            <StockQuoteBar
              label="点击查看分时走势"
              percent={
                dataInfo ? stockUtils.getPercent({ close: dataInfo.extPrice, prevClose: dataInfo.close }) : undefined
              }
              close={dataInfo?.extPrice}
              prevClose={dataInfo?.close}
              time={dateUtils.toUsDay(dataInfo?.extUpdated ?? '0').format('MM/DD HH:mm')}
              tradingLabel="盘后价"
              side="bottom"
              contentClassName="text-xs"
              interval={StockChartInterval.AFTER_HOURS}
            />
          )
        ) : null}
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
const StockQuoteBar = withTooltip(
  memo((props: StockQuoteBarProps) => {
    const symbol = useSymbolQuery()
    // const trading = useTime(s => s.getTrading())
    const onClick = () => {
      chartManage.setInterval(props.interval)
    }

    const trading = useMemo(() => stockUtils.intervalToTrading(props.interval), [props.interval])

    const [arrowUp, setArrowUp] = usePropValue(Decimal.create(props?.percent).gt(0))

    return (
      <div
        className={cn(
          'flex items-baseline flex-wrap px-2 box-border my-1 cursor-pointer text-tertiary',
          props.interval !== StockChartInterval.INTRA_DAY && 'text-sm'
        )}
        onClick={onClick}
        onKeyDown={() => { }}
      >
        <span
          className={cn(
            'text-xl font-500 text-foreground',
            props.interval === StockChartInterval.INTRA_DAY && 'text-[32px]'
          )}
        >
          <SubscribeSpan.Price
            symbol={symbol}
            arrow={false}
            showColor={false}
            decimal={3}
            trading={trading}
            initDirection={Decimal.create(props?.percent).gt(0)}
            initValue={props.close}
            zeroText="0.000"
          />
          {!props.close ? null : (
            <JknIcon.Svg
              name={arrowUp ? 'stock-up' : 'stock-down'}
              className={cn(
                arrowUp ? 'text-stock-up' : 'text-stock-down',
                'ml-1',
                props.interval === StockChartInterval.INTRA_DAY ? 'w-4 h-[18px]' : 'w-2.5 h-[11px] '
              )}
            />
          )}
        </span>
        &nbsp;&nbsp;
        <span>
          <SubscribeSpan.Percent
            type="amount"
            symbol={symbol}
            trading={trading}
            decimal={3}
            onChange={v => {
              setArrowUp(v.record.close - v.record.preClose > 0)
            }}
            showSign={props.percent !== Number.POSITIVE_INFINITY}
            showColor={props.percent !== Number.POSITIVE_INFINITY}
            initDirection={Decimal.create(props?.percent).gt(0)}
            initValue={props.percent !== Number.POSITIVE_INFINITY ? (props?.close ?? 0) - (props?.prevClose ?? 0) : '-'}
            zeroText="0.000"
            nanText="--"
          />
        </span>
        &nbsp;&nbsp;
        <span>
          <SubscribeSpan.Percent
            symbol={symbol}
            decimal={2}
            trading={trading}
            showSign
            initDirection={Decimal.create(props?.percent).gt(0)}
            initValue={props.percent}
            zeroText="0.00%"
            showColor={props.percent !== Number.POSITIVE_INFINITY}
            nanText="--"
          />
        </span>
        <span className="text-tertiary w-full text-xs mt-1">
          {props.tradingLabel} &nbsp;
          <SubscribeSpan
            trading={trading}
            symbol={symbol}
            value={props.time}
            formatter={v => dateUtils.toUsDay(v.record.time).format('MM/DD HH:mm')}
          />
        </span>
      </div>
    )
  })
)

const StockQuote = () => {
  const [expanded, setExpanded] = useState(false)
  const code = useSymbolQuery()

  // const quote = useQuery({
  //   queryKey: [getStockQuote.cacheKey, code],
  //   queryFn: () => getStockQuote(code)
  // })

  const [codeInfo, setCodeInfo] = useState<StockBaseInfoData>()

  // const codeInfoQuery = useQuery({
  //   queryKey: [getStockBaseCodeInfo.cacheKey, code, stockBaseCodeInfoExtend],
  //   queryFn: () => getStockBaseCodeInfo({ symbol: code, extend: stockBaseCodeInfoExtend })
  // })

  useSnapshot(
    code,
    useCallback(e => {
      setCodeInfo(s => {
        const _s: any = s ?? {}
        Object.keys(e.data).map((key: any) => {
          if (e.data[key as keyof StockBaseInfoData] === undefined) {
            return
          }
          _s[key] = e.data[key as keyof StockBaseInfoData]
        })
        return { ..._s }
      })
    }, [])
  )

  useEffect(() => {
    if (code !== codeInfo?.symbol) {
      setCodeInfo(undefined)
    }
  }, [code, codeInfo])

  // const [stock, _, __] = codeInfoQuery.data ? stockUtils.toStockWithExt(codeInfoQuery.data) : []

  // const bubble = useMemo(() => {
  //   const bubble = {
  //     value: codeInfo.data?.extend?.bubble?.bubble_val ?? 0,
  //     text: codeInfo.data?.extend?.bubble?.bubble_status ?? ''
  //   }

  //   return bubble
  // }, [codeInfo.data])

  return (
    <div className="bg-background">
      <div className="mt-1 grid grid-cols-2 text-sm px-2 gap-y-2 gap-x-4 text-tertiary">
        <div className="flex items-center justify-between">
          <span>最高价&nbsp;&nbsp;</span>
          <span>{Decimal.create(codeInfo?.dayHigh).toFixed(3)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>今开价&nbsp;&nbsp;</span>
          <span>{Decimal.create(codeInfo?.dayOpen).toFixed(3)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>最低价&nbsp;&nbsp;</span>
          <span>{Decimal.create(codeInfo?.dayLow).toFixed(3)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>成交额&nbsp;&nbsp;</span>
          <span>{Decimal.create(codeInfo?.dayAmount).toShortCN()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>总市值&nbsp;&nbsp;</span>
          <span>{Decimal.create(codeInfo?.marketCap).toShortCN(3)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>换手率&nbsp;&nbsp;</span>
          <span>{Decimal.create(codeInfo?.turnover).mul(100).toFixed(2)}%</span>
        </div>
        {expanded ? (
          <>
            <div className="flex items-center justify-between">
              <span>昨收价&nbsp;&nbsp;</span>
              <span>{Decimal.create(codeInfo?.prevClose).toFixed(3)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>成交量&nbsp;&nbsp;</span>
              <span>{Decimal.create(codeInfo?.dayVolume).toShortCN()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>市盈率&nbsp;&nbsp;</span>
              <span>{codeInfo?.pe ? Decimal.create(codeInfo.pe).toFixed(2) : '--'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>市净率&nbsp;&nbsp;</span>
              <span>{codeInfo?.pb ? Decimal.create(codeInfo.pb).toFixed(2) : '--'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>52周高&nbsp;&nbsp;</span>
              <span>{Decimal.create(codeInfo?.w52High).toFixed(3)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>52周低&nbsp;&nbsp;</span>
              <span>{Decimal.create(codeInfo?.w52Low).toFixed(3)}</span>
            </div>
          </>
        ) : null}
      </div>
      {codeInfo?.bubbleStatus && expanded ? (
        <div className="flex h-12">
          <div className="w-1/2 flex items-center justify-center text-stock-green h-full">估值泡沫</div>
          <div className="w-1/2 flex items-center justify-center text-stock-green h-full">
            <span className={cn(Decimal.create(codeInfo?.bubbleVal).gte(2) ? 'text-stock-down' : 'text-stock-up')}>
              {Decimal.create(codeInfo?.bubbleVal).toFixed(2)}({codeInfo?.bubbleStatus})
            </span>
          </div>
        </div>
      ) : null}

      {
        <div className="w-full text-center">
          <span
            className="bg-accent rounded-3xl w-6 h-3 inline-flex items-center justify-center cursor-pointer"
            onClick={() => setExpanded(!expanded)}
            onKeyDown={() => { }}
          >
            <JknIcon.Svg name="arrow-down" style={{ rotate: expanded ? '180deg' : '0deg' }} size={6} />
          </span>
        </div>
      }
      {/* TODO UI未设计泡沫估值 */}
      {/* {+bubble.value !== 0 ? (
        <div className="flex h-12">
          <div className="w-1/2 flex items-center justify-center border-0 border-r border-b border-solid border-border text-stock-green h-full">
            估值泡沫
          </div>
          <div className="w-1/2 flex items-center justify-center border-0 border-b border-solid border-border text-stock-green h-full">
            <span className={cn(Decimal.create(bubble.value).gte(2) ? 'text-stock-down' : 'text-stock-up')}>
              {Decimal.create(bubble.value).toFixed(2)}({bubble.text})
            </span>
          </div>
        </div>
      ) : null} */}
    </div>
  )
}

const StockNews = () => {
  const code = useSymbolQuery()
  const newList = useQuery({
    queryKey: [getStockNotice.cacheKey, code],
    queryFn: () => getStockNotice(code)
  })

  const newGroup = useMemo(() => {
    const data = newList.data?.event ?? []

    const dateGroup: Record<string, typeof data> = {}

    data.forEach(item => {
      const date = dateUtils.toUsDay(item.time).format('M-D w')

      if (!dateGroup[date]) {
        dateGroup[date] = []
      }

      dateGroup[date].push(item)
    })


    return listify(dateGroup, (k, v) => ({ date: k, event: v }))
  }, [newList.data])

  const navigate = useNavigate()

  return (
    <>
      {newList.data ? (
        <div className="p-2 w-full box-border bg-background">
          <div className="bg-[#3d3152] flex w-full rounded-lg items-center px-2 py-1 box-border">
            <HoverCard openDelay={100}>
              <HoverCardTrigger>
                <JknIcon.Svg name="message" className="mr-2 mt-0.5 text-[#A77FED]" size={14}  />
              </HoverCardTrigger>
              <HoverCardContent side="left" align="start" className="w-80 p-0 rounded flex overflow-hidden bg-[#1F1F1F]" sideOffset={40} alignOffset={-120}>
                <div className="items-stretch w-1 bg-[#A77FED]" />
                <div className="box-border p-5 flex-1">
                  <div className="flex items-center">
                    <span className="size-6 rounded-full border border-solid border-[#A77FED] text-center text-[#A77FED]"><JknIcon.Svg name="message" className="mt-[5px]" size={14} /></span>
                    &nbsp; &nbsp;<span className="text-lg font-bold">最新消息</span>
                  </div>
                  <div className="">
                    {newGroup.slice(0, 2).map((item, index, arr) => (
                      <div
                        key={item.date}
                        className={cn('flex-grow-0 flex-shrink-0 basis-full mt-4')}
                        onKeyDown={() => { }}
                      >
                        <div>
                          <span className="">{item.date}</span>
                          {
                            item.event.map((event) => (
                              <div key={event.title ?? nanoid(4)} className="flex flex-col mt-3">
                                <span className="w-full line-clamp-1">{event.title.slice(14)}</span>
                                <span className="text-sm text-tertiary mt-1">
                                  发布于&nbsp;
                                  <JknIcon name="ic_us" className="size-3" />&nbsp;
                                  {
                                    dateUtils.toUsDay(event.time).format('美东时间 M月D日 w HH:mm')
                                  }
                                </span>
                              </div>
                            ))
                          }
                        </div>
                        {
                          index !== arr.length - 1 ? (
                            <Separator className="mt-4"  />
                          ): null
                        }
                      </div>
                    ))}
                  </div>
                  {
                    newGroup.length > 2 ? (
                      <Button className="bg-[#3D3D3D] text-foreground mt-4 px-4 text-sm" onClick={() => navigate('/calendar')}>查看更多</Button>
                    ): null
                  }
                </div>
              </HoverCardContent>
            </HoverCard>
            <div className="flex-1">
              <Carousel
                plugins={[
                  Autoplay({
                    delay: 1000 * 5
                  })
                ]}
                orientation="vertical"
              >
                <CarouselContent className="h-12">
                  {newList.data?.event.map(item => (
                    <div key={nanoid()} className="flex-grow-0 flex-shrink-0 basis-full flex items-center">
                      {<span className="text-xs">{item.title}</span>}
                    </div>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
            <JknIcon.Svg name="arrow-right" size={8} />
          </div>
        </div>
      ) : null}
    </>
  )
}

type TableDataType = {
  symbol: string
  name: string
  close: number
  percent?: number
  marketValue?: number
}

const StockRelated = () => {
  const code = useSymbolQuery()
  const [plates, setPlates] = useState<{ id: string; name: string }[]>([])
  const [plateId, setPlateId] = useState<string>()
  const [menuType, setMenuType] = useState<'plates' | 'trades'>('plates')
  const relates = useQuery({
    queryKey: [
      getStockRelated.cacheKey,
      code,
      ['total_share'],
      plateId === undefined || plateId === plates[0]?.id ? undefined : plateId
    ],
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

    setList(
      relates.data?.stocks.map(item => {
        return stockUtils.toStockWithExt(item.stock, { extend: item.extend, symbol: item.symbol, name: item.name })
      })
    )
  }, [relates.data, setList])

  const columns = useMemo<JknRcTableProps['columns']>(
    () => [
      {
        title: '名称代码',
        dataIndex: 'symbol',
        sort: true,
        align: 'left',
        render: symbol => <StockView code={symbol} iconSize={16} className="text-base" />
      },
      {
        title: '现价',
        dataIndex: 'close',
        align: 'right',
        width: '30%',
        sort: true,
        render: (close, row) => (
          <SubscribeSpan.PriceBlink className="text-base" symbol={row.symbol} initValue={close} showColor={false} />
        )
      },
      {
        title: '涨跌幅%',
        dataIndex: 'percent',
        align: 'right',
        width: '30%',
        sort: true,
        render: (percent, row) => (
          <SubscribeSpan.PercentBlink
            className="text-base"
            symbol={row.symbol}
            decimal={2}
            initValue={percent}
            initDirection={Decimal.create(row.percent).gte(0)}
          />
        )
      }
    ],
    []
  )

  const tradesBySort = useMemo(() => {
    return trades.data?.sort((a, b) => {
      return dayjs(a.t).valueOf() - dayjs(b.t).valueOf()
    })
  }, [trades.data])

  const onRowClick = useTableRowClickToStockTrading('symbol')

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background rounded h-full">
      <div className="flex px-3 py-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div onClick={() => setMenuType('plates')} onKeyDown={() => { }}>
              <span className="text-lg font-bold">
                {plates?.find(item => item.id === plateId)?.name ? (
                  <span>
                    {plates?.find(item => item.id === plateId)?.name}
                  </span>
                ) : (
                  '相关股票'
                )}
              </span>
              <JknIcon.Svg name="arrow-down" className="ml-1 w-3 h-3" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {plates?.map(item => (
              <DropdownMenuItem
                onClick={() => {
                  setPlateId(item.id)
                  setMenuType('plates')
                }}
                key={item.id}
              >
                {item.name}
              </DropdownMenuItem>
            ))}
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
        {menuType === 'plates' ? (
          <JknRcTable
            isLoading={relates.isLoading}
            rowKey="symbol"
            data={list}
            columns={columns}
            onSort={onSort as any}
            onRow={onRowClick}
          />
        ) : (
          <ScrollArea className="flex flex-col text-xs space-y-2 px-2 h-full">
            {tradesBySort?.map(item => (
              <div key={nanoid()} className="flex items-center">
                <span className="flex-1">{item.t.slice(11)}</span>
                <span className="text-stock-down text-right flex-1">{item.v}</span>
                <span className="text-stock-down text-right flex-1">{item.p}</span>
              </div>
            ))}
          </ScrollArea>
        )}
      </div>
    </div>
  )
}

/**
 * 股票简介
 */
// const StockBrief = () => {
//   const code = useSymbolQuery()
//
//   const { data: brief } = useQuery({
//     queryKey: [getStockBrief.cacheKey, code],
//     queryFn: () => getStockBrief(code)
//   })
//
//   return (
//     <div className="text-secondary text-sm py-4 space-y-4">
//       <div className="text-sm px-2">概况</div>
//       <div className="flex items-center px-2 w-full overflow-hidden">
//         <span className="w-16 flex-shrink-0">公司名称</span>
//         <span className="text-foreground">{brief?.name ?? '-'}</span>
//       </div>
//       <div className="flex items-center px-2 w-full overflow-hidden">
//         <span className="w-16 flex-shrink-0">所属行业</span>
//         <span className="text-foreground">{brief?.sic_description ?? '-'}</span>
//       </div>
//       <div className="flex items-center px-2 w-full overflow-hidden">
//         <span className="w-16 flex-shrink-0">成立时间</span>
//         <span className="text-foreground">{brief?.list_date ?? '-'}</span>
//       </div>
//       <div className="flex items-center px-2 w-full overflow-hidden">
//         <span className="w-16 flex-shrink-0">员工人数</span>
//         <span className="text-foreground">{brief?.total_employees ?? '-'}</span>
//       </div>
//       <div className="flex items-center px-2 w-full overflow-hidden">
//         <span className="w-16 flex-shrink-0">公司网站</span>
//         <span className="text-foreground">{brief?.homepage_url ?? '-'}</span>
//       </div>
//       <div className="flex items-center px-2 w-full overflow-hidden">
//         <span className="w-16 flex-shrink-0">联系电话</span>
//         <span className="text-foreground">{brief?.phone_number ?? '-'}</span>
//       </div>
//       <div className="flex items-center px-2 w-full overflow-hidden">
//         <span className="w-16 flex-shrink-0">证券类型</span>
//         <span className="text-foreground">{brief?.market ?? '-'}</span>
//       </div>
//       <Separator />
//       <div className="text-sm px-2">简介</div>
//       <div className="text-foreground px-2">{brief?.description ?? '-'}</div>
//     </div>
//   )
// }

const GoldenStockPool = () => {
  const [type, setType] = useState('-1')
  const { token } = useToken()
  const [list, { setList, onSort }] = useTableData<ReturnType<typeof stockUtils.toStockWithExt>>([], 'symbol')

  const query = useQuery({
    queryKey: [getStockCollects.cacheKey, type],
    refetchInterval: 5 * 1000,
    queryFn: () =>
      getStockCollects({
        cate_id: +type,
        extend: [
          'total_share',
          'basic_index',
          'day_basic',
          'alarm_ai',
          'alarm_all',
          'financials',
          'thumbs',
          'stock_after',
          'stock_before'
        ],
        limit: 300
      }),
    enabled: !!token
  })

  useEffect(() => {
    const list =
      query.data?.items.map(item =>
        stockUtils.toStockWithExt(item.stock, { extend: item.extend, name: item.name, symbol: item.symbol })
      ) ?? []
    setList(list)
  }, [query.data, setList])

  useStockQuoteSubscribe(query.data?.items?.map(d => d.symbol) ?? [])

  const columns: TableProps<ArrayItem<typeof list>>['columns'] = [
    {
      title: '名称代码',
      dataIndex: 'name',
      align: 'left',
      sort: true,
      render: (_name, row) => <StockView code={row.symbol} iconSize={16} className="text-base" />
    },
    {
      title: '现价',
      dataIndex: 'close',
      align: 'right',
      width: '30%',
      sort: true,
      render: (close, row) => (
        <SubscribeSpan.PriceBlink
          className="text-base"
          symbol={row.symbol}
          initValue={close}
          initDirection={stockUtils.isUp(row)}
          showColor={false}
        />
      )
    },
    {
      title: '涨跌幅',
      dataIndex: 'percent',
      align: 'right',
      width: '30%',
      sort: true,
      render: (percent, row) => (
        <SubscribeSpan.PercentBlink
          className="text-base"
          showSign
          symbol={row.symbol}
          decimal={2}
          initValue={percent}
          initDirection={stockUtils.isUp(row)}
        />
      )
    }
  ]

  const onRowClick = useTableRowClickToStockTrading('symbol')

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-background rounded">
      <div className="flex items-center border-b-[#1B1B1B] text-foreground">
        <CollectDropdownMenu activeKey={type} onChange={setType} />
      </div>
      <div className="flex-1 overflow-hidden ">
        <JknRcTable
          isLoading={query.isLoading}
          columns={columns}
          data={list}
          onSort={onSort}
          rowKey="symbol"
          className="w-full"
          onRow={onRowClick}
        />
      </div>
    </div>
  )
}
