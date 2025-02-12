import {
  type StockExtend,
  addStockCollect,
  getStockCollectCates,
  getStockCollects,
  removeStockCollect,
  removeStockCollectCate,
  updateStockCollectCate
} from '@/api'
import {
  AddCollect,
  AiAlarm,
  Button,
  CollectCapsuleTabs,
  Input,
  JknAlert,
  JknCheckbox,
  JknIcon,
  JknRcTable,
  type JknRcTableProps,
  Popover,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  StockView,
  SubscribeSpan,
  useModal
} from '@/components'
import { useCheckboxGroup, useTableData, useTableRowClickToStockTrading, useToast } from '@/hooks'
import { stockUtils } from '@/utils/stock'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useBoolean } from 'ahooks'
import to from 'await-to-js'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import { type PropsWithChildren, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

const baseExtends: StockExtend[] = ['total_share', 'basic_index', 'day_basic', 'alarm_ai', 'alarm_all', 'financials']

type TableDataType = ReturnType<typeof stockUtils.toStockWithExt>

const GoldenPool = () => {
  const [activeStock, setActiveStock] = useState<string>('1')
  const { checked, onChange, setCheckedAll, getIsChecked } = useCheckboxGroup([])
  const queryClient = useQueryClient()

  const collects = useQuery({
    queryKey: [getStockCollects.cacheKey, activeStock],
    queryFn: () => getStockCollects({ cate_id: +activeStock, limit: 300, extend: baseExtends })
  })

  const [list, { setList, onSort }] = useTableData<TableDataType>([], 'symbol')

  useEffect(() => {
    setList(
      collects.data?.items.map(o =>
        stockUtils.toStockWithExt(o.stock, { extend: o.extend, name: o.name, symbol: o.symbol })
      ) ?? []
    )
  }, [collects.data, setList])

  const onActiveStockChange = (v: string) => {
    setActiveStock(v)
  }

  const { toast } = useToast()
  const onRemove = useCallback(
    async (code: string, name: string) => {
      if (!activeStock) return
      JknAlert.confirm({
        title: '确认移除',
        content: <div className="text-center mt-4">确认将 {name} 移出金池?</div>,
        onAction: async action => {
          if (action !== 'confirm') return
          const [err] = await to(removeStockCollect({ symbols: [code], cate_ids: [+activeStock] }))

          if (err) {
            toast({ description: err.message })
            return
          }

          collects.refetch()
          queryClient.refetchQueries({
            queryKey: [getStockCollectCates.cacheKey]
          })
        }
      })
    },
    [activeStock, collects, toast, queryClient]
  )

  const columns: JknRcTableProps<TableDataType>['columns'] = useMemo(
    () => [
      {
        title: '序号',
        dataIndex: 'index',
        align: 'center',
        width: 60,
        render: (_, __, index) => <div className="text-center w-full">{index + 1}</div>
      },
      {
        title: '名称代码',
        dataIndex: 'name',
        sort: true,
        align: 'left',
        render: (_, row) => <StockView name={row.name} code={row.symbol} />
      },
      {
        title: '现价',
        dataIndex: 'close',
        align: 'right',
        sort: true,
        render: (_, row) => (
          <div className="w-full text-right">
            <SubscribeSpan.PriceBlink
              symbol={row.symbol}
              initValue={row.close}
              decimal={3}
              initDirection={stockUtils.isUp(row)}
            />
          </div>
        )
      },
      {
        title: '涨跌幅',
        dataIndex: 'percent',
        align: 'right',
        width: 120,
        sort: true,
        render: (_, row) => (
          <div className="w-full text-right">
            <SubscribeSpan.PercentBlockBlink
              decimal={2}
              initValue={stockUtils.getPercent(row)}
              initDirection={stockUtils.isUp(row)}
              symbol={row.symbol}
            />
          </div>
        )
      },
      {
        title: '成交额',
        dataIndex: 'turnover',
        align: 'right',
        sort: true,
        render: (_, row) => (
          <div className="w-full text-right">
            <SubscribeSpan.TurnoverBlink symbol={row.symbol} initValue={row.turnover} showColor={false} decimal={2} />
          </div>
        )
      },
      {
        title: '总市值',
        dataIndex: 'marketValue',
        align: 'right',
        sort: true,
        render: (_, row) => (
          <div className="w-full text-right">
            <SubscribeSpan.MarketValue
              symbol={row.symbol}
              initValue={stockUtils.getMarketValue(row)}
              decimal={2}
              showColor={false}
              totalShare={row.totalShare ?? 0}
            />
          </div>
        )
      },
      {
        title: '换手率',
        dataIndex: 'turnoverRate',
        align: 'right',
        sort: true,
        render: (_, row) => (
          <div className="w-full text-right">
            <SubscribeSpan
              symbol={row.symbol}
              value={`${Decimal.create(stockUtils.getTurnOverRate(row) ?? 0)
                .mul(100)
                .toFixed(2)}%`}
              formatter={data => {
                const r = { ...row }
                if (!r.marketValue) return '--'
                r.turnover = data.record.turnover

                return `${Decimal.create(stockUtils.getTurnOverRate(r)).mul(100).toFixed(2)}%`
              }}
            />
          </div>
        )
      },
      {
        title: '市盈率',
        dataIndex: 'pe',
        align: 'right',
        sort: true,
        render: pe => (
          <div className="w-full text-right">{`${Decimal.create(pe).lt(0) ? '亏损' : Decimal.create(pe).toFixed(2)}`}</div>
        )
      },
      {
        title: '市净率',
        dataIndex: 'pb',
        align: 'right',
        sort: true,
        render: pb => <div className="w-full text-right">{`${Decimal.create(pb).toFixed(2) ?? '-'}`}</div>
      },
      {
        title: '行业板块',
        dataIndex: 'industry',
        align: 'right',
        sort: true,
        render: (_, row) => <div className="w-full text-right">{row.industry}</div>
      },
      {
        title: '+AI报警',
        dataIndex: 'ai',
        width: 80,
        align: 'center',
        render: (_, row) => (
          <div className="text-center w-full">
            <AiAlarm code={row.symbol}>
              <JknIcon name="ic_add" className="rounded-none" />
            </AiAlarm>
          </div>
        )
      },
      {
        title: '移除',
        dataIndex: 'opt',
        align: 'center',
        width: 60,
        render: (_, row) => (
          <div
            className="cursor-pointer text-tertiary text-center w-full"
            onClick={() => onRemove(row.symbol, row.symbol)}
            onKeyDown={() => {}}
          >
            <JknIcon name="del" className="w-4 h-4" />
          </div>
        )
      },
      {
        title: (
          <GoldenPoolBatch
            activeStock={activeStock}
            maxChecked={checked.length === list.length}
            checked={checked}
            onCheckedChange={e => setCheckedAll(e ? list.map(item => item.symbol) : [])}
            onUpdate={() => {
              collects.refetch()
              setCheckedAll([])
            }}
          />
        ),
        dataIndex: 'check',
        align: 'center',
        width: 60,
        render: (_, row) => (
          <div className="w-full text-center">
            <JknCheckbox checked={getIsChecked(row.symbol)} onCheckedChange={v => onChange(row.symbol, v)} />
          </div>
        )
      }
    ],
    [activeStock, checked, getIsChecked, onChange, setCheckedAll, list, onRemove, collects.refetch]
  )

  const onRowClick = useTableRowClickToStockTrading('symbol')

  return (
    <div className="h-full overflow-hidden flex flex-col golden-pool">
      <div className="flex-shrink-0 h-8 py-1.5 box-border flex items-center">
        <div className="flex-1 overflow-x-auto">
          <CollectCapsuleTabs activeKey={activeStock} onChange={onActiveStockChange} />
        </div>
        <div className="text-secondary">
          <GoldenPoolManager />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <JknRcTable
          virtual
          isLoading={collects.isLoading}
          rowKey="symbol"
          columns={columns}
          data={list}
          onRow={onRowClick}
          onSort={onSort}
        />
      </div>
      <style jsx>
        {`
            .golden-pool :global(.ant-checkbox-inner){
              border-color: var(--text-tertiary-color);
            }

            .golden-pool :global(.ant-checkbox-checked .ant-checkbox-inner){
              border-color: #388bff;
            }
          `}
      </style>
    </div>
  )
}

const GoldenPoolManager = memo(() => {
  const table = useModal({
    content: <GoldenPoolTable />,
    title: '管理金池',
    footer: null,
    closeIcon: true,
    className: 'w-[780px]',
    onOpen: () => {}
  })

  return (
    <>
      <div
        className="cursor-pointer text-sm pr-2 flex items-center"
        onClick={() => table.modal.open()}
        onKeyDown={() => {}}
      >
        <JknIcon name="ic_setting_sm" className="mr-1" />
        管理金池
      </div>
      {table.context}
    </>
  )
})

const GoldenPoolTable = () => {
  const cates = useQuery({
    queryKey: [getStockCollectCates.cacheKey],
    queryFn: () => getStockCollectCates()
  })

  const columns: JknRcTableProps['columns'] = [
    {
      title: '序号',
      dataIndex: 'index',
      align: 'center',
      width: 60,
      render: (_, __, index) => <div className="text-center leading-10">{index + 1}</div>
    },
    { title: '股票名称', dataIndex: 'name', align: 'left' },
    { title: '股票数量', dataIndex: 'total', align: 'left' },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      align: 'left',
      render: v => (v !== '0' ? dayjs(+v * 1000).format('YYYY-MM-DD') : '-')
    },
    {
      title: '操作',
      dataIndex: 'opt',
      align: 'center',
      width: 120,
      render: (_, row) =>
        row.id !== '1' ? (
          <div className="flex items-center justify-around">
            <GoldenPoolNameEdit id={row.id as string} onUpdate={cates.refetch}>
              <span className="cursor-pointer">重命名</span>
            </GoldenPoolNameEdit>
            <span
              className="cursor-pointer"
              onClick={() => onDelete(row.id as string, row.name as string)}
              onKeyDown={() => {}}
            >
              删除
            </span>
          </div>
        ) : null
    }
  ]

  const { toast } = useToast()

  const onDelete = async (id: string, name: string) => {
    JknAlert.confirm({
      title: '删除金池',
      cancelBtn: true,
      content: (
        <div className="mt-4">
          <span className="block text-center text-base mb-2">确认删除 {name}?</span>
          <span className="text-center text-sm">此操作不可撤销</span>
        </div>
      ),
      onAction: async action => {
        if (action === 'confirm') {
          const [err] = await to(removeStockCollectCate(id))

          if (err) {
            toast({ description: err.message })
            return false
          }

          cates.refetch()
        }
      }
    })
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="h-[480px] w-full overflow-hidden">
        <JknRcTable columns={columns} data={cates.data} isLoading={cates.isLoading} />
      </div>
      <div className="text-center mb-4">
        <AddCollect>
          <Button variant="default">
            <span>新建金池</span>
          </Button>
        </AddCollect>
      </div>
    </div>
  )
}

const GoldenPoolNameEdit = (props: PropsWithChildren<{ id: string; onUpdate: () => void }>) => {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const onAdd = async () => {
    const [err] = await to(updateStockCollectCate({ id: props.id, name }))

    if (err) {
      toast({ description: err.message })
      return
    }

    toast({ description: '修改成功' })
    props.onUpdate()
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button reset className="inline">
          {props.children}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 text-center">
        <div className="bg-background text-center py-2">新建金池</div>
        <div className="px-4 mt-4">
          <Input
            size="sm"
            className="border-transparent border-b-gray-500 rounded-none"
            placeholder="输入金池名称"
            onChange={e => setName(e.target.value)}
          />
          <PopoverClose asChild>
            <Button size="sm" className="w-16 my-4" onClick={onAdd}>
              确定
            </Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface GoldenPoolBatchProps {
  checked: string[]
  maxChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  activeStock: string
  onUpdate?: () => void
}

const GoldenPoolBatch = (props: GoldenPoolBatchProps) => {
  const { toast } = useToast()
  const [confirmModalOpen, confirmAction] = useBoolean(false)
  const cates = useQuery({
    queryKey: [getStockCollectCates.cacheKey],
    queryFn: () => getStockCollectCates()
  })
  const action = useRef<{
    type: 'add' | 'remove'
    cateId: string
  }>()

  const onRemoveBatch = async (cateId: string) => {
    const [err] = await to(
      removeStockCollect({
        symbols: props.checked,
        cate_ids: [+cateId]
      })
    )

    if (err) {
      toast({
        description: err.message
      })
      return
    }

    toast({
      description: '删除成功'
    })
    props.onUpdate?.()
    confirmAction.setFalse()
  }

  const onAdd = async (cateId: string) => {
    const [err] = await to(
      addStockCollect({
        symbols: props.checked,
        cate_ids: [+cateId]
      })
    )

    if (err) {
      toast({
        description: err.message
      })
      return
    }

    cates.refetch()
    confirmAction.setFalse()
    props.onUpdate?.()
    toast({
      description: '添加成功'
    })
  }

  const onAction = (ac: 'add' | 'remove', cateId: string) => {
    confirmAction.setTrue()
    action.current = {
      type: ac,
      cateId
    }
  }

  return (
    <Popover open={props.checked.length > 0}>
      <PopoverAnchor asChild>
        <Button className="reset" variant="icon">
          <JknCheckbox checked={props.maxChecked} onCheckedChange={props.onCheckedChange} />
        </Button>
      </PopoverAnchor>
      <PopoverContent align="start" side="left" className="w-56">
        <div className="rounded pb-2 relative">
          <div className="bg-background text-center py-2">批量操作 {props.checked.length} 项</div>
          <div className="flex items-center justify-between px-4 py-2">
            {cates.data?.find(c => +c.id === +props.activeStock)?.name}
            <Button size="mini" variant="destructive" onClick={() => onAction('remove', props.activeStock)}>
              删除
            </Button>
          </div>
          {cates.data
            ?.filter(cate => +cate.id !== +props.activeStock)
            .map(cate => (
              <div key={cate.id} className="flex items-center justify-between px-4 py-2">
                <span>{cate.name}</span>
                <Button size="mini" onClick={() => onAction('add', cate.id)}>
                  添加
                </Button>
              </div>
            ))}

          {confirmModalOpen ? (
            <div className="absolute bottom-0 left-0 top-0 right-0 bg-background/60">
              <div className="text-center flex flex-col justify-center h-full space-y-4">
                <div>确定操作?</div>
                <div className="flex justify-center space-x-4">
                  <Button
                    size="mini"
                    onClick={() =>
                      action.current?.cateId &&
                      (action.current?.type === 'add'
                        ? onAdd(action.current?.cateId)
                        : onRemoveBatch(action.current?.cateId))
                    }
                  >
                    确定
                  </Button>
                  <Button size="mini" variant="text" onClick={confirmAction.setFalse}>
                    取消
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default GoldenPool
