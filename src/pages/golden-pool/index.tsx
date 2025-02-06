import { type StockExtend, addStockCollectCate, getStockCollectCates, getStockCollects, removeStockCollect, removeStockCollectCate, updateStockCollectCate } from "@/api"
import { AddCollect, AiAlarm, Button, CapsuleTabs, CollectCapsuleTabs, JknAlert, JknCheckbox, JknIcon, JknRcTable, type JknRcTableProps, NumSpan, NumSpanSubscribe, Popover, PopoverAnchor, PopoverContent, StockView, useFormModal, useModal } from "@/components"
import { useCheckboxGroup, useTableData, useTableRowClickToStockTrading, useToast, useZForm } from "@/hooks"
import { stockUtils } from "@/utils/stock"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import to from "await-to-js"
import dayjs from "dayjs"
import Decimal from "decimal.js"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import type { z } from "zod"
import { GoldenPoolForm, poolSchema } from "./components/golden-pool-form"

const baseExtends: StockExtend[] = ['total_share', 'basic_index', 'day_basic', 'alarm_ai', 'alarm_all', 'financials']

type TableDataType = ReturnType<typeof stockUtils.toStockWithExt>

const GoldenPool = () => {
  const [activeStock, setActiveStock] = useState<string>('1')
  const { checked, onChange, setCheckedAll, getIsChecked } = useCheckboxGroup([])
  const queryClient = useQueryClient()

  const collects = useQuery({
    queryKey: [getStockCollects.cacheKey, activeStock],
    queryFn: () => getStockCollects({ cate_id: +activeStock, limit: 300, extend: baseExtends }),
  })

  const [list, { setList, onSort }] = useTableData<TableDataType>([], 'symbol')

  useEffect(() => {
    setList(collects.data?.items.map(o => stockUtils.toStockWithExt(o.stock, { extend: o.extend, name: o.name, symbol: o.symbol })) ?? [])
  }, [collects.data, setList])


  const onActiveStockChange = (v: string) => {
    setActiveStock(v)
  }


  const { toast } = useToast()
  const onRemove = useCallback(async (code: string, name: string) => {
    if (!activeStock) return
    JknAlert.confirm({
      title: '确认移除',
      content: <div className="text-center mt-4">确认将 {name} 移出金池?</div>,
      onAction: async (action) => {
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
  }, [activeStock, collects, toast, queryClient])

  const onRemoveBatch = useCallback(async () => {
    if (!activeStock) return
    JknAlert.confirm({
      title: '批量操作',
      content: <div className="text-center mt-4">确定该操作?</div>,
      onAction: async (action) => {
        if (action !== 'confirm') return
        const [err] = await to(removeStockCollect({ symbols: checked, cate_ids: [+activeStock] }))

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
  }, [activeStock, collects, toast, checked, queryClient])


  const columns: JknRcTableProps<TableDataType>['columns'] = useMemo(() => [
    {
      title: '序号', dataIndex: 'index', align: 'center', width: 60,
      render: (_, __, index) => <div className="text-center w-full">{index + 1}</div>
    },
    {
      title: '名称代码', dataIndex: 'name', sort: true, align: 'left',
      render: (_, row) => <StockView name={row.name} code={row.symbol} />
    },
    {
      title: '现价', dataIndex: 'close', align: 'right', sort: true,
      render: (_, row) => <NumSpanSubscribe blink className="w-full" code={row.symbol} field="close" value={row.close} decimal={3} isPositive={stockUtils.isUp(row)} align="right" />
    },
    {
      title: '涨跌幅', dataIndex: 'percent', align: 'right', width: 120, sort: true,
      render: (_, row) => (
        <NumSpanSubscribe code={row.symbol} blink field="percent" percent block decimal={2} value={stockUtils.getPercent(row)} isPositive={stockUtils.isUp(row)} symbol align="right" />
      )
    },
    {
      title: '成交额', dataIndex: 'turnover', align: 'right', sort: true,
      render: (_, row) => <NumSpanSubscribe blink code={row.symbol} field="turnover" value={row.turnover} decimal={2} align="right" unit />
    },
    {
      title: '总市值', dataIndex: 'marketValue', align: 'right', sort: true,
      render: (_, row) => <NumSpanSubscribe blink code={row.symbol} field={v => stockUtils.getSubscribeMarketValue(row, v)} value={stockUtils.getMarketValue(row)} decimal={2} align="right" unit />
    },
    {
      title: '换手率', dataIndex: 'turnoverRate', align: 'right', sort: true,
      render: (_, row) => <NumSpanSubscribe blink code={row.symbol} field={v => stockUtils.getSubscribeTurnOverRate(row, v)} value={stockUtils.getTurnOverRate(row)} decimal={2} align="right" percent />
    },
    {
      title: '市盈率', dataIndex: 'pe', align: 'right', sort: true,
      render: (pe) => <div className="w-full text-right">{`${Decimal.create(pe).toFixed(2) ?? '-'}`}</div>
    },
    {
      title: '市净率', dataIndex: 'pb', align: 'right', sort: true,
      render: (pb) => <div className="w-full text-right">{`${Decimal.create(pb).toFixed(2) ?? '-'}`}</div>
    },
    {
      title: '行业板块', dataIndex: 'industry', align: 'right', sort: true,
      render: (_, row) => <div className="w-full text-right">{row.industry}</div>
    },
    {
      title: '+AI报警', dataIndex: 'ai', width: 80, align: 'center',
      render: (_, row) => <div className="text-center w-full"><AiAlarm code={row.symbol} ><JknIcon name="ic_add" className="rounded-none" /></AiAlarm></div>
    },
    {
      title: '移除', dataIndex: 'opt', align: 'center', width: 60,
      render: (_, row) => (
        <div className="cursor-pointer text-tertiary text-center w-full" onClick={() => onRemove(row.symbol, row.name)} onKeyDown={() => { }}>
          <JknIcon name="del" className="w-4 h-4" />
        </div>
      )
    },
    {
      title: <Popover open={checked.length > 0}>
        <PopoverAnchor asChild>
          <Button className="reset" variant="icon" >
            <JknCheckbox
              checked={checked.length > 0}
              onCheckedChange={e => setCheckedAll(e ? list.map(o => o.symbol) : [])}
            />
          </Button>
        </PopoverAnchor>
        <PopoverContent align="start" side="left">
          <div className="rounded">
            <div className="bg-background px-16 py-2">批量操作 {checked.length} 项</div>
            <div className="text-center px-4 py-4">
              {
                collects.data?.items.find(c => c.id === activeStock)?.name
              }
              &emsp;
              <span
                className="inline-block rounded-sm border-style-secondary text-tertiary cursor-pointer px-1"
                onClick={onRemoveBatch} onKeyDown={() => { }}
              >删除</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>,
      dataIndex: 'check', align: 'center', width: 60,
      render: (_, row) => (
        <div className="w-full text-center">
          <JknCheckbox checked={getIsChecked(row.symbol)} onCheckedChange={v => onChange(row.symbol, v)} />
        </div>
      )
    },
  ], [activeStock, onRemoveBatch, checked, getIsChecked, onChange, setCheckedAll, list, onRemove, collects.data])

  const onRowClick = useTableRowClickToStockTrading('symbol')

  return (
    <div className="h-full overflow-hidden flex flex-col golden-pool">
      <div className="flex-shrink-0 h-8 py-1.5 box-border flex items-center">
        <div className="flex-1 overflow-x-auto">
          <CollectCapsuleTabs activeKey={activeStock} onChange={onActiveStockChange} />
          {/* <CapsuleTabs activeKey={activeStock} onChange={onActiveStockChange}>
            {
              cates.collects.map((cate) => (
                <CapsuleTabs.Tab
                  key={cate.id}
                  label={
                    <span>{cate.name}({cate.total})</span>
                  }
                  value={cate.id} />
              ))
            }
          </CapsuleTabs> */}
        </div>
        <div className="text-secondary">
          <GoldenPoolManager />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">

        <JknRcTable virtual isLoading={collects.isLoading} rowKey="symbol" columns={columns} data={list} onRow={onRowClick} onSort={onSort} />
      </div>
      <style jsx>
        {
          `
            .golden-pool :global(.ant-checkbox-inner){
              border-color: var(--text-tertiary-color);
            }

            .golden-pool :global(.ant-checkbox-checked .ant-checkbox-inner){
              border-color: #388bff;
            }
          `
        }
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
    onOpen: () => { }
  })


  return (
    <>
      <div className="cursor-pointer text-sm pr-2 flex items-center" onClick={() => table.modal.open()} onKeyDown={() => { }}>
        <JknIcon name="ic_setting_sm" className="mr-1" />
        管理金池
      </div>
      {
        table.context
      }
    </>
  )
})


const GoldenPoolTable = () => {
  const cates = useQuery({
    queryKey: [getStockCollectCates.cacheKey],
    queryFn: () => getStockCollectCates(),
  })

  const columns: JknRcTableProps['columns'] = [
    {
      title: '序号',
      dataIndex: 'index',
      align: 'center',
      width: 60,
      render: (_, __, index) => <div className="text-center">{index + 1}</div>
    },
    { title: '股票名称', dataIndex: 'name', align: 'left' },
    { title: '股票数量', dataIndex: 'total', align: 'left' },
    { title: '创建时间', dataIndex: 'create_time', align: 'left', render: (v) => v !== '0' ? dayjs(+v * 1000).format('YYYY-MM-DD HH:mm') : '-' },
    {
      title: '操作',
      dataIndex: 'opt',
      align: 'center',
      width: 120,
      render: (_, row) => (
        row.id !== '1' ? (
          <div className="flex items-center justify-around">
            <span className="cursor-pointer" onClick={() => edit.open(row)} onKeyDown={() => { }}>重命名</span>
            <span className="cursor-pointer" onClick={() => onDelete(row.id as string, row.name as string)} onKeyDown={() => { }}>删除</span>
          </div>
        ) : null
      )
    },
  ]
  const form = useZForm(poolSchema, {
    id: '',
    name: ''
  })

  const { toast } = useToast()

  const edit = useFormModal<typeof poolSchema>({
    content: <GoldenPoolForm />,
    title: '编辑金池',
    className: 'w-[480px]',
    form,
    onOk: async (values) => {
      const [err] = await to(values.id ? updateStockCollectCate(values) : addStockCollectCate(values.name))

      if (err) {
        toast({ description: err.message })
        return
      }
      edit.close()
      cates.refetch()

    },
    onOpen: (values?: z.infer<typeof poolSchema>) => {
      if (values) {
        form.setValue('id', values.id)
        form.setValue('name', values.name)
      }

    }
  })

  const onDelete = async (id: string, name: string) => {

    JknAlert.confirm({
      title: '删除金池',
      cancelBtn: true,
      content: <span className="mt-4 block text-center text-base">确认删除 {name}?</span>,
      onAction: async (action) => {
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
      {
        edit.context
      }
    </div>
  )
}




export default GoldenPool