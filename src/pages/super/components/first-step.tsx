import { type StockExtend, getPlateList, getPlateStocks, getStockCollectCates, getStockCollects } from '@/api'
import {
  Checkbox,
  JknIcon,
  JknRcTable,
  type JknRcTableProps,
  StockView,
  SubscribeSpan,
  ToggleGroup,
  ToggleGroupItem
} from '@/components'
import { useAuthorized, useCheckboxGroup, useTableData, useTableRowClickToStockTrading } from '@/hooks'
import { type Stock, stockUtils } from '@/utils/stock'
import { cn } from '@/utils/style'
import { useQuery } from '@tanstack/react-query'
import { useMount, useUnmount, useUpdateEffect } from 'ahooks'
import Decimal from 'decimal.js'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SuperStockContext } from '../ctx'

const baseExtends: StockExtend[] = ['total_share', 'basic_index', 'day_basic', 'alarm_ai', 'alarm_all', 'financials']

const FirstStep = () => {
  const [type, setType] = useState('spec')

  const onClickType = (type: string) => {
    setType(type)
  }

  return (
    <div className="h-[400px] flex items-center border-0 border-b border-solid border-background">
      <div className="w-36 px-4 flex items-center flex-shrink-0 border border-solid border-background h-full">
        第一步：选股范围
      </div>
      <div className="h-full overflow-hidden flex-1 ">
        <div className="flex w-full">
          <div
            className={cn(
              'w-1/4 text-center py-4 text-sm border border-solid border-background -ml-[1px]',
              type === 'spec' && 'text-primary'
            )}
            onClick={() => onClickType('spec')}
            onKeyDown={() => { }}
          >
            特色榜单
          </div>
          <div
            className={cn(
              'w-1/4 text-center py-4 text-sm border border-solid border-background -ml-[1px]',
              type === 'golden' && 'text-primary'
            )}
            onClick={() => onClickType('golden')}
            onKeyDown={() => { }}
          >
            股票金池
          </div>
          <div
            className={cn(
              'w-1/4 text-center py-4 text-sm border border-solid border-background -ml-[1px]',
              type === 'industry' && 'text-primary'
            )}
            onClick={() => onClickType('industry')}
            onKeyDown={() => { }}
          >
            行业板块
          </div>
          <div
            className={cn(
              'w-1/4 text-center py-4 text-sm border border-solid border-background -ml-[1px]',
              type === 'concept' && 'text-primary'
            )}
            onClick={() => onClickType('concept')}
            onKeyDown={() => { }}
          >
            概念板块
          </div>
        </div>
        {
          {
            golden: <GoldenPoolTabContent />,
            spec: <RecommendIndex />,
            industry: <Plate type={1} />,
            concept: <Plate type={2} />
          }[type]
        }
      </div>
    </div>
  )
}

const GoldenPoolTabContent = () => {
  const [cateId, setCateId] = useState(1)

  return (
    <div className="flex h-full overflow-hidden">
      <GoldenPool onChange={setCateId} />
      <GoldenPoolList cateId={cateId} />
    </div>
  )
}

interface GoldenPoolProps {
  onChange?: (id: number) => void
}

const GoldenPool = (props: GoldenPoolProps) => {
  const selection = useRef<string[]>([])
  const ctx = useContext(SuperStockContext)
  const { checked, toggle, getIsChecked } = useCheckboxGroup([])
  const collects = useQuery({
    queryKey: [getStockCollectCates.cacheKey],
    queryFn: () => getStockCollectCates()
  })
  useMount(() => {
    ctx.register(
      'collect',
      1,
      () => [...selection.current],
      () => selection.current.length > 0
    )
  })

  useUnmount(() => {
    ctx.unregister('collect')
    selection.current = []
  })

  useEffect(() => {
    selection.current = checked
  }, [checked])

  const columns: JknRcTableProps<{ name: string; id: string }>['columns'] = [
    {
      title: <JknIcon name="checkbox_mult_nor_dis" className="w-4 h-4" />,
      dataIndex: 'select',
      align: 'center',
      width: 40,
      render: (_, row) => (
        <div className="flex items-center justify-center w-full">
          <Checkbox checked={getIsChecked(row.id)} onCheckedChange={() => toggle(row.id)} />
        </div>
      )
    },
    {
      title: '序号',
      dataIndex: 'index',
      align: 'center',
      width: 40,
      render: (_, __, index) => <div className="text-center">{index + 1}</div>
    },
    {
      title: '金池名称',
      dataIndex: 'name'
    }
  ]

  return (
    <div className="h-[calc(100%-52px)] w-[30%]">
      <JknRcTable
        rowKey="id"
        onRow={r => ({
          onClick: () => {
            toggle(r.id)
            props.onChange?.(+r.id)
          }
        })}
        data={collects.data ?? []}
        columns={columns}
      />
    </div>
  )
}

interface GoldenPoolListProps {
  cateId: number
}
const GoldenPoolList = (props: GoldenPoolListProps) => {
  const query = useQuery({
    queryKey: [getStockCollects.cacheKey, props.cateId],
    queryFn: () => getStockCollects({ cate_id: props.cateId, extend: baseExtends, limit: 300 }),
    enabled: !!props.cateId
  })

  const [list, { setList, onSort }] = useTableData<Stock>([], 'symbol')

  useEffect(() => {
    setList(
      query.data?.items.map(o => {
        const s = stockUtils.toStock(o.stock, { extend: o.extend, name: o.name, symbol: o.symbol })

        return {
          ...s,
          percent: stockUtils.getPercent(s),
          marketValue: stockUtils.getMarketValue(s)
        }
      }) ?? []
    )
  }, [query.data, setList])

  const columns: JknRcTableProps<ArrayItem<typeof list>>['columns'] = [
    {
      title: '序号',
      dataIndex: 'index',
      align: 'center',
      width: 60,
      render: (_, __, index) => <div className="text-center">{index + 1}</div>
    },
    {
      title: '金池名称',
      dataIndex: 'name',
      sort: true,
      render: (name, row) => <StockView name={name} code={row.symbol} />
    },
    {
      title: '现价',
      dataIndex: 'close',
      sort: true,
      align: 'right',
      width: 90,
      render: (close, row) => (
        <SubscribeSpan.PriceBlink
          symbol={row.symbol}
          initValue={close ?? 0}
          decimal={3}
          initDirection={stockUtils.isUp(row)}
        />
      )
    },
    {
      title: '涨跌幅',
      dataIndex: 'percent',
      sort: true,
      align: 'right',
      width: 90,
      render: (percent, row) => (
        <SubscribeSpan.PercentBlockBlink
          symbol={row.symbol}
          decimal={2}
          initValue={percent}
          initDirection={stockUtils.isUp(row)}
        />
      )
    },
    {
      title: '成交额',
      dataIndex: 'turnover',
      align: 'right',
      sort: true,
      width: 90,
      render: (turnover, row) => (
        <SubscribeSpan.TurnoverBlink showColor={false} symbol={row.symbol} decimal={2} initValue={turnover} />
      )
    },
    {
      title: '总市值',
      dataIndex: 'marketValue',
      sort: true,
      align: 'right',
      width: 90,
      render: (marketValue, row) => (
        <SubscribeSpan.MarketValueBlink
          symbol={row.symbol}
          showColor={false}
          decimal={2}
          initValue={marketValue}
          totalShare={row.totalShare ?? 0}
        />
      )
    }
  ]

  const onRowClick = useTableRowClickToStockTrading('symbol')

  return (
    <div className="h-[calc(100%-52px)] w-[70%]">
      <JknRcTable
        rowKey="symbol"
        isLoading={query.isLoading}
        columns={columns}
        data={list}
        onSort={onSort}
        onRow={onRowClick}
      />
    </div>
  )
}

const RecommendIndex = () => {
  const ctx = useContext(SuperStockContext)
  const data = (ctx.data?.stock_range?.children?.t_recommend.from_datas ?? []) as unknown as {
    name: string
    value: string
    authorized: 0 | 1
  }[]
  const selection = useRef<string[]>([])

  useMount(() => {
    ctx.register(
      'recommend',
      1,
      () => [...selection.current],
      () => selection.current.length > 0
    )
  })

  useUnmount(() => {
    ctx.unregister('recommend')
    selection.current = []
  })

  const [_, toastNotAuth] = useAuthorized()

  return (
    <ToggleGroup
      onValueChange={value => {
        selection.current = value
      }}
      type="multiple"
      className="grid grid-cols-3 gap-4 p-4"
    >
      {data?.map(child =>
        child.name !== '' ? (
          <div key={child.value} onClick={() => !child.authorized && toastNotAuth()} onKeyDown={() => { }}>
            <ToggleGroupItem className="w-full h-full relative" value={child.value} disabled={!child.authorized}>
              {
                !child.authorized && <JknIcon name="ic_lock" className="absolute right-0 top-0 w-3 h-3 rounded-none" />
              }
              {child.name}
            </ToggleGroupItem>
          </div>
        ) : null
      )}
    </ToggleGroup>
  )
}

//板块组件
const Plate = (props: { type: 1 | 2 }) => {
  const [activePlate, setActivePlate] = useState<string>()

  const plate = useQuery({
    queryKey: [getPlateList.cacheKey, props.type],
    queryFn: () => getPlateList(props.type),
    placeholderData: []
  })

  useUpdateEffect(() => {
    setActivePlate(undefined)
    if (plate.data && plate.data.length > 0) {
      setActivePlate(plate.data[0].id)
    }
  }, [plate.data])

  const onClickPlate = (row: PlateDataType) => {
    setActivePlate(row.id)
  }

  return (
    <div className="flex overflow-hidden h-full">
      <div className="w-[40%] h-full">
        <PlateList data={plate.data ?? []} onRowClick={onClickPlate} />
      </div>
      <div className="w-[60%] h-full">
        <PlateStocks plateId={activePlate ? +activePlate : undefined} />
      </div>
    </div>
  )
}

type PlateDataType = {
  amount: number
  change: number
  hot_rise: number
  id: string
  name: string
}

interface PlateListProps {
  data: PlateDataType[]
  onRowClick: (row: PlateDataType) => void
}

const PlateList = (props: PlateListProps) => {
  const { checked, toggle, getIsChecked } = useCheckboxGroup([])
  const ctx = useContext(SuperStockContext)
  const selection = useRef<string[]>([])

  useMount(() => {
    ctx.register(
      'sectors',
      1,
      () => [...selection.current],
      () => selection.current.length > 0
    )
  })

  useUnmount(() => {
    ctx.unregister('sectors')
    selection.current = []
  })

  useEffect(() => {
    selection.current = checked
  }, [checked])

  const [list, { onSort, setList }] = useTableData<PlateDataType>(props.data)

  useUpdateEffect(() => {
    setList(props.data)
  }, [props.data])

  const columns = useMemo<JknRcTableProps<PlateDataType>['columns']>(
    () => [
      {
        title: <JknIcon name="checkbox_mult_nor_dis" className="w-4 h-4" />,
        dataIndex: 'select',
        id: 'select',
        align: 'center',
        width: 30,
        render: (_, row) => (
          <div className="flex items-center justify-center w-full">
            <JknIcon.Checkbox
              checked={getIsChecked(row.id)}
              className="rounded-none"
              checkedIcon="checkbox_mult_sel"
              uncheckedIcon="checkbox_mult_nor"
            />
          </div>
        )
      },
      { title: '序号', align: 'left', dataIndex: 'index', width: 40, render: (_, __, index) => index + 1 },
      {
        title: '行业',
        align: 'left',
        dataIndex: 'name',
        render: (_, row) => <div className="w-full overflow-hidden text-ellipsis whitespace-nowrap">{row.name}</div>
      },
      {
        title: '涨跌幅',
        dataIndex: 'change',
        sort: true,
        width: 90,
        align: 'center',
        render: (_, row) => (
          <SubscribeSpan.PercentBlock
            subscribe={false}
            symbol=""
            initValue={row.change / 100}
            initDirection={row.change > 0}
          />
        )
      },
      {
        title: '成交额',
        dataIndex: 'amount',
        sort: true,
        align: 'right',
        width: 120,
        render: (_, row) => Decimal.create(row.amount).toShortCN(3)
      }
    ],
    [getIsChecked]
  )
  return (
    <JknRcTable
      rowKey="id"
      onRow={r => ({
        onClick: () => {
          toggle(r.id)
          props.onRowClick?.(r)
        }
      })}
      data={list}
      columns={columns}
      onSort={onSort}
    />
  )
}

interface PlateStocksProps {
  plateId?: number
}

export type PlateStockTableDataType = {
  code: string
  name: string
  price?: number
  // 涨跌幅
  percent?: number
  // 成交额
  amount?: number
  // 总市值
  total?: number
  // 换手率
  turnoverRate?: number
  // 市盈率
  pe?: number
  // 市净率
  pb?: number
  collect: 1 | 0
}
const PlateStocks = (props: PlateStocksProps) => {
  const plateStocks = useQuery({
    queryKey: [getPlateStocks.cacheKey, props.plateId],
    queryFn: () => getPlateStocks(props.plateId!, ['basic_index', 'stock_before', 'stock_after', 'total_share']),
    enabled: !!props.plateId
  })

  const [list, { setList, onSort }] = useTableData<Stock>([], 'symbol')

  useEffect(() => {
    setList(
      plateStocks.data?.map(o => {
        const s = stockUtils.toStock(o.stock, { extend: o.extend, name: o.name, symbol: o.symbol })

        return {
          ...s,
          percent: stockUtils.getPercent(s),
          marketValue: stockUtils.getMarketValue(s)
        }
      }) ?? []
    )
  }, [plateStocks.data, setList])

  const columns = useMemo<JknRcTableProps<ArrayItem<typeof list>>['columns']>(
    () => [
      { title: '序号', dataIndex: 'index', align: 'center', width: 60, render: (_, __, index) => index + 1 },
      {
        title: '名称代码',
        dataIndex: 'name',
        align: 'left',
        sort: true,
        render: (name, row) => <StockView name={name} code={row.symbol} />
      },
      {
        title: '现价',
        dataIndex: 'close',
        align: 'right',
        sort: true,
        render: (close, row) => (
          <SubscribeSpan.PriceBlink
            symbol={row.symbol}
            initValue={close}
            decimal={3}
            initDirection={stockUtils.isUp(row)}
          />
        )
      },
      {
        title: '涨跌幅',
        dataIndex: 'percent',
        align: 'right',
        width: 90,
        sort: true,
        render: (percent, row) => (
          <SubscribeSpan.PercentBlockBlink
            symbol={row.symbol}
            showSign
            decimal={2}
            initValue={percent}
            initDirection={stockUtils.isUp(row)}
          />
        )
      },
      {
        title: '成交额',
        dataIndex: 'turnover',
        align: 'right',
        sort: true,
        render: (turnover, row) => (
          <SubscribeSpan.TurnoverBlink showColor={false} symbol={row.symbol} decimal={2} initValue={turnover} />
        )
      },
      {
        title: '总市值',
        dataIndex: 'marketValue',
        align: 'right',
        sort: true,
        render: (marketValue, row) => (
          <SubscribeSpan.MarketValueBlink
            showColor={false}
            totalShare={row.totalShare ?? 0}
            symbol={row.symbol}
            decimal={2}
            initValue={marketValue}
          />
        )
      }
    ],
    []
  )

  const onRowClick = useTableRowClickToStockTrading('symbol')

  return (
    <JknRcTable
      rowKey="symbol"
      isLoading={plateStocks.isLoading}
      onRow={onRowClick}
      onSort={onSort}
      columns={columns}
      data={list}
    />
  )
}

export default FirstStep
