import { StockPushType, getStockPush, getStockPushList } from "@/api"
import { getPushMenu } from "@/api/push"
import {
  CapsuleTabs,
  JknIcon,
  JknRcTable,
  JknDatePicker,
  type JknRcTableProps,
  StockView,
  SubscribeSpan,
  CollectStar,
  Button,
  Star,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components"
import {
  useStockQuoteSubscribe,
  useTableData,
  useTableRowClickToStockTrading,
} from "@/hooks"
import { useTime } from "@/store"
import { getPrevTradingDays } from "@/utils/date"
import { type Stock, stockUtils } from "@/utils/stock"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useEffect, useRef, useState } from "react"

type TableDataType = Stock & {
  star: string
  update_time: string
  create_time: string
  /**
   * warning = 0, 画闪电
   * warning = 1, 画绿色火苗
   */
  warning: string
  /**
   * bull = 0, 画红色火苗
   * bull = 1, 画绿色火苗
   */
  bull: string
  id: string
  percent?: number
  marketValue?: number
  collect?: number
}

const getLastTime = () => {
  const usTime = useTime.getState().usTime
  const localTime = useTime.getState().localStamp
  const localDate = dayjs(new Date().valueOf() - localTime + usTime).tz(
    "America/New_York"
  )

  if (localDate.isBefore(localDate.hour(9).minute(30).second(0))) {
    return getPrevTradingDays(localDate, 2)[0]
  }
  return getPrevTradingDays(localDate, 1)[0]
}

const getTableList = async (type: string, date?: string) => {
  let res: TableDataType[]
  if (type === "JRGW") {
    if (!date) throw new Error("date is required")
    const r = await getStockPush({
      type: StockPushType.STOCK_KING,
      date,
      extend: ["financials", "total_share", "collect", "basic_index"],
    })

    res = r?.map((item) => {
      const stock = stockUtils.toStockWithExt(item.stock, {
        extend: item.extend,
        symbol: item.symbol,
        name: item.name,
      }) as TableDataType
      stock.update_time = item.update_time
      stock.star = item.star
      stock.id = item.id
      stock.warning = item.warning
      stock.percent = stockUtils.getPercent(stock)
      stock.marketValue = stockUtils.getMarketValue(stock)
      stock.bull = item.bull
      stock.create_time = item.create_time
      stock.collect = item.extend?.collect ?? 0

      return stock
    })
  } else {
    const r = await getStockPushList(type, [
      "financials",
      "total_share",
      "collect",
      "basic_index",
    ])

    res = r.map((item) => {
      const stock = stockUtils.toStockWithExt(item.stock, {
        extend: item.extend,
        symbol: item.symbol,
        name: item.name,
      }) as TableDataType
      stock.update_time = item.datetime.toString()
      stock.star = item.score.toString()
      stock.id = item.symbol
      stock.warning = (item.type - 1).toString()
      stock.percent = stockUtils.getPercent(stock)
      stock.marketValue = stockUtils.getMarketValue(stock)
      stock.bull = item.bull.toString()
      stock.create_time = item.datetime.toString()
      stock.collect = item.extend?.collect ?? 0

      return stock
    })
  }

  return res
}

const PushPage = () => {
  const [activeType, setActiveType] = useState<string>("JRGW")
  const [date, setDate] = useState(getLastTime())
  const [list, { setList, onSort }] = useTableData<TableDataType>([], "id")
  const dates = useRef(getPrevTradingDays(date, 7))

  const menus = useQuery({
    queryKey: [getPushMenu.cacheKey],
    queryFn: getPushMenu,
  })

  // const queryParams: Parameters<typeof getStockPush>[0] = {
  //   type: activeType,
  //   date,
  //   extend: ['financials', 'total_share', 'collect', 'basic_index']
  // }

  const query = useQuery({
    queryKey: [getStockPushList.cacheKey, activeType, date],
    queryFn: () => getTableList(activeType, date),
  })
  const queryClient = useQueryClient()

  useEffect(() => {
    // if (query.data) {
    //   setList(query.data.map(item => {
    //     const stock = stockUtils.toStock(item.stock, { extend: item.extend, symbol: item.symbol, name: item.name }) as TableDataType
    //     stock.update_time = item.update_time
    //     stock.star = item.star
    //     stock.id = item.id
    //     stock.warning = item.warning
    //     stock.percent = stockUtils.getPercent(stock)
    //     stock.marketValue = stockUtils.getMarketValue(stock)
    //     stock.bull = item.bull
    //     stock.coiling_signal = item.coiling_signal
    //     stock.interval = item.interval
    //     stock.create_time = item.create_time
    //     return stock
    //   }))
    // } else {
    //   setList([])
    // }

    setList(query.data ?? [])
  }, [query.data, setList])

  useStockQuoteSubscribe(query.data?.map((v) => v.symbol) ?? [])

  const columns = (() => {
    const common: JknRcTableProps<TableDataType>["columns"] = [
      {
        title: "名称代码",
        dataIndex: "symbol",
        align: "left",
        width: "25%",
        sort: true,
        render: (_, row) => (
          <div className="flex items-center">
            <CollectStar checked={row.collect === 1} code={row.symbol} />
            <span className="mr-3" />
            <StockView name={row.name} code={row.symbol as string} showName />
          </div>
        ),
      },
      {
        title: "现价",
        dataIndex: "close",
        align: "left",
        width: "13.5%",
        sort: true,
        render: (v, row) => (
          <SubscribeSpan.PriceBlink
            showColor={false}
            symbol={row.symbol}
            initValue={v}
            initDirection={stockUtils.isUp(row)}
          />
        ),
      },
      {
        title: "涨跌幅%",
        dataIndex: "percent",
        align: "left",
        width: "13.5%",
        sort: true,
        render: (percent, row) => (
          <SubscribeSpan.PercentBlink
            symbol={row.symbol}
            decimal={2}
            showSign
            initValue={percent}
            initDirection={stockUtils.isUp(row)}
          />
        ),
      },
      {
        title: "成交额",
        dataIndex: "turnover",
        align: "left",
        width: "13.5%",
        sort: true,
        render: (turnover, row) => (
          <SubscribeSpan.TurnoverBlink
            showColor={false}
            symbol={row.symbol}
            decimal={2}
            initValue={turnover}
            initDirection
          />
        ),
      },
      {
        title: "总市值",
        dataIndex: "marketValue",
        align: "left",
        width: "13.5%",
        sort: true,
        render: (marketValue, row) => (
          <SubscribeSpan.MarketValueBlink
            showColor={false}
            symbol={row.symbol}
            decimal={2}
            initValue={marketValue}
            totalShare={row.totalShare ?? 0}
          />
        ),
      },
      {
        title: `${activeType === "JRGW"
          ? "股王指数"
          : menus.data?.find((item) => item.key === activeType)?.name
          }`,
        dataIndex: "star",
        align: "right",
        sort: true,
        render: (v, row) =>
          activeType === 'JRGW' ?
            Array.from({ length: v }).map((_, i) => <JknIcon
              className="w-[16px] h-[16px]"
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              key={i}
              name={"ic_fire_red"}
            />) : <Star.Rect count={v} activeColor={row.bull === "1" ? "#22AB94" : "#F23645"} total={5} />,

      },
    ]
    return common
  })()


  const onRowClick = useTableRowClickToStockTrading("symbol")

  return (
    <div className="h-full w-full overflow-hidden flex justify-center bg-black">
      <div className="h-full overflow-hidden flex flex-col w-table pt-[40px] stock-push">
        <div className="flex items-center flex-shrink-0 pl-2">
          <CapsuleTabs
            activeKey={activeType}
            onChange={(v) => setActiveType(v as StockPushType)}
          >
            <CapsuleTabs.Tab value="JRGW" label="今日股王" />
            {menus.data?.map((item) => (
              <CapsuleTabs.Tab
                key={item.key}
                value={item.key}
                label={item.title}
              />
            ))}
          </CapsuleTabs>
          {activeType === "JRGW" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="border border-solid px-3 py-1 rounded text-base border-[#2E2E2E] text-[#808080] ml-auto">
                  {dayjs(date).format("MM-DD W")}
                  &nbsp;
                  <JknIcon.Svg name="arrow-down" size={12} color="#808080" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {
                  dates.current.map(item => (
                    <DropdownMenuItem key={item} onClick={() => setDate(item)}>
                      {item}
                    </DropdownMenuItem>
                  ))
                }
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
        {/* {activeType === "JRGW" ? (
          <div className="flex items-center pt-5 pl-2">
            <JknDatePicker onChange={(v) => v && setDate(v)}>
              <Button variant="outline" className="h-8 px-2 text-base border-[#2E2E2E] text-[#808080]">
                {dayjs(date).format("MM-DD W")}
                <JknIcon.Svg name="arrow-down" size={8} color="#808080" />
              </Button>
            </JknDatePicker>
          </div>
        ) : null} */}
        <div className="flex-1 overflow-hidden">
          <JknRcTable
            headerHeight={61}
            rowKey="id"
            onSort={onSort}
            columns={columns}
            data={list}
            isLoading={query.isLoading}
            onRow={onRowClick}
          />
        </div>
      </div>

      <style jsx global>{`
        .stock-push .rc-table th {
          padding-top: 20px;
          padding-bottom: 20px;
          border: none;
        }
        .stock-push .rc-table td {
          border: none;
          height: 50px;
          padding-top: 0;
          padding-bottom: 0;
        }
      `}
      </style>
    </div>
  )
}

export default PushPage
