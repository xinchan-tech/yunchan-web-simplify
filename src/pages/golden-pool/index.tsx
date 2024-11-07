import { type StockExtend, addStockCollectCate, getStockCollectCates, getStockCollects, removeStockCollect, removeStockCollectCate, updateStockCollectCate } from "@/api"
import { Button, CapsuleTabs, Checkbox, FormControl, FormField, FormItem, FormLabel, Input, JknAlert, JknTable, type JknTableProps, Popover, PopoverContent, PopoverTrigger, useFormModal, useModal } from "@/components"
import { useDomSize, useToast } from "@/hooks"
import useZForm from "@/hooks/use-z-form"
import { useStock, useTime } from "@/store"
import { numToFixed, priceToCnUnit } from "@/utils/price"
import { cn } from "@/utils/style"
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons"
import { useRequest } from "ahooks"
import to from "await-to-js"
import Decimal from "decimal.js"
import { useMemo, useState } from "react"
import { useFormContext } from "react-hook-form"
import { useImmer } from "use-immer"
import { z } from "zod"

const baseExtends: StockExtend[] = ['total_share', 'basic_index', 'day_basic', 'alarm_ai', 'alarm_all', 'financials']
type CollectCate = Awaited<ReturnType<typeof getStockCollectCates>>[0]

type DataType = {
  index: number
  key: string
  code: string
  name: string
  price: number
  percent: number
  turnover: number
  marketValue: number
  dataIndex: string
  pe: number
}
const GoldenPool = () => {
  const [activeStock, setActiveStock] = useState<string>()
  const [size, ref] = useDomSize<HTMLDivElement>()
  const time = useTime()
  const stock = useStock()
  const [check, setCheck] = useImmer<{ all: boolean, selected: string[] }>({
    all: false,
    selected: []
  })
  const cates = useRequest(getStockCollectCates, {
    cacheKey: 'collectCates',
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setActiveStock(data[0].id)
        collects.run({
          extend: baseExtends,
          cate_id: +data[0].id,
          limit: 300
        })
      }
    }
  })

  const collects = useRequest(getStockCollects, {
    cacheKey: 'stockCollects',
    manual: true
  })

  const data = useMemo<DataType[]>(() => {
    let trading = time.getTrading()

    if (trading === 'close') {
      trading = 'intraDay'
    }

    const r: DataType[] = []

    if (!collects.data) return r

    for (let i = 0; i < collects.data.items.length; i++) {
      const c = collects.data.items[i]
      const s = stock.getLastRecord(c.symbol)

      if (s) {
        const marketValue = (c.extend?.total_share as number ?? 0) * s.close
        const pe = new Decimal(marketValue).div(c.extend?.liabilities_and_equity as string ?? 0).times(c.extend?.total_share as number ?? 0)
        r.push({
          index: i + 1,
          key: c.symbol,
          code: c.symbol,
          name: c.name,
          price: s.close,
          percent: s.percent,
          turnover: s.turnover,
          marketValue: marketValue,
          dataIndex: c.extend?.basic_index as string ?? '-',
          pe: pe.toNumber()
        })
      }else{
        r.push({
          index: i + 1,
          key: c.symbol,
          code: c.symbol,
          name: c.name,
          price: 0,
          percent: 0,
          turnover: 0,
          marketValue: 0,
          dataIndex: '-',
          pe: 0
        })
      }
    }

    return r
  }, [time, collects.data, stock])

  const onActiveStockChange = (v: string) => {
    setActiveStock(v)
  }

  const onCheckboxClick = (code: string) => {
    if (check.selected.includes(code)) {
      setCheck(d => {
        d.selected = d.selected.filter(s => s !== code)
        d.all = d.selected.length === data?.length
      })
    } else {
      setCheck(d => {
        d.selected.push(code)
      })
    }
  }

  const onCheckAllChange = (e: boolean) => {
    setCheck(d => {
      d.all = e
      d.selected = e ? data?.map(d => d.key) ?? [] : []
    })
  }

  const { toast } = useToast()
  const onRemove = async (code: string, name: string) => {
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

        collects.refresh()
      }
    })
  }

  const onRemoveBatch = async () => {
    if (!activeStock) return
    JknAlert.confirm({
      title: '批量操作',
      content: <div className="text-center mt-4">确定该操作?</div>,
      onAction: async (action) => {
        if(action !== 'confirm') return
        const [err] = await to(removeStockCollect({ symbols: check.selected, cate_ids: [+activeStock] }))

        if (err) {
          toast({ description: err.message })
          return
        }

        collects.refresh()
        setCheck(d => {
          d.all = false
          d.selected = []
        })
      }
    })
  }


  const columns: JknTableProps<DataType>['columns'] = [
    { header: '序号', accessorKey: 'index', meta: { align: 'center', width: 40 } },
    {
      header: '名称代码', accessorKey: 'name', meta: { width: '25%' },
      cell: ({ row }) => (
        <div className="overflow-hidden">
          <div className="text-secondary">{row.original.code}</div>
          <div className="text-tertiary text-xs text-ellipsis overflow-hidden whitespace-nowrap w-full">{row.getValue('name')}</div>
        </div>
      )

    },
    {
      header: '现价', accessorKey: 'price', meta: { width: '25%', align: 'right' },
      cell: ({ row }) => <span className={cn(row.getValue<number>('percent') >= 0 ? 'text-stock-up' : 'text-stock-down')}>
        {numToFixed(row.getValue<number>('price'))}
      </span>
    },
    {
      header: '涨跌幅', accessorKey: 'percent', meta: { width: '22%', align: 'right' },
      cell: ({ row }) => (
        <div className={cn(row.getValue<number>('percent') >= 0 ? 'bg-stock-up' : 'bg-stock-down', 'h-full rounded-sm w-16 text-center px-1 py-0.5 float-right')}>
          {row.getValue<number>('percent') > 0 ? '+' : null}{`${numToFixed(row.getValue<number>('percent') * 100, 2)}%`}
        </div>
      )
    },
    {
      header: '成交额', accessorKey: 'turnover', meta: { width: '17%', align: 'right' },
      cell: ({ row }) => <span>
        {priceToCnUnit(row.getValue<number>('percent') * 10000, 2)}
      </span>
    },
    {
      header: '总市值', accessorKey: 'marketValue', meta: { width: '19%', align: 'right' },
      cell: ({ row }) => <span>
        {priceToCnUnit(row.getValue<number>('percent'), 2)}
      </span>
    },
    {
      header: '换手率', accessorKey: 't', meta: { width: '19%', align: 'right' },
      cell: () => '0.00%'
    },
    // TODO: 待计算公式
    {
      header: '市盈率', accessorKey: 'pe', meta: { width: '19%', align: 'right' },
      cell: ({ row }) => <span>
        {numToFixed(row.getValue<number>('percent'), 2)}
      </span>
    },
    {
      header: '行业板块', accessorKey: 'dataIndex', meta: { width: '19%', align: 'right' },
    },
    {
      header: '+AI报警', accessorKey: 'ai', meta: { width: 80, align: 'center' },
      cell: () => (
        <div className="text-stock-up cursor-pointer">
          <PlusIcon />
        </div>
      )
    },
    {
      header: '移除',
      accessorKey: 'opt',
      meta: { align: 'center', width: 60 },
      cell: ({ row }) => (
        <div className="cursor-pointer text-tertiary">
          <TrashIcon onClick={() => onRemove(row.original.code, row.original.name)} />
        </div>
      )
    },
    {
      header: () => (
        <Popover open={check.selected.length > 0}>
          <PopoverTrigger asChild>
            <Checkbox checked={check.all} onCheckedChange={onCheckAllChange} />
          </PopoverTrigger>
          <PopoverContent align="start" side="left">
            <div className="rounded">
              <div className="bg-background px-16 py-2">批量操作 {check.selected.length} 项</div>
              <div className="text-center px-4 py-4">
                {
                  cates.data?.find(c => c.id === activeStock)?.name
                }
                &emsp;
                <span
                  className="inline-block rounded-sm border-style-secondary text-tertiary cursor-pointer px-1"
                  onClick={onRemoveBatch} onKeyDown={() => { }}
                >删除</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ),
      accessorKey: 'check',
      meta: { align: 'center', width: 60 },
      cell: ({ row }) => (
        <Checkbox checked={check.selected.includes(row.original.code)} onCheckedChange={() => onCheckboxClick(row.original.code)} />
      )
    },
  ]

  return (
    <div className="h-full overflow-hidden flex flex-col golden-pool">
      <div className="flex-shrink-0 h-8 py-1.5 box-border flex items-center">
        <div className="flex-1 overflow-x-auto">
          <CapsuleTabs activeKey={activeStock} onChange={onActiveStockChange}>
            {
              cates.data?.map((cate) => (
                <CapsuleTabs.Tab
                  key={cate.id}
                  label={
                    <span>{cate.name}({cate.total})</span>
                  }
                  value={cate.id} />
              ))
            }
          </CapsuleTabs>
        </div>
        <div className="text-secondary">
          <GoldenPoolManager data={cates.data ?? []} onUpdate={cates.refresh} />
        </div>
      </div>
      <div className="flex-1" ref={ref}>
        <div >
          <JknTable columns={columns} data={data} />
        </div>
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

interface GoldenPoolManagerProps {
  data: CollectCate[]
  onUpdate: () => void
}

const GoldenPoolManager = (props: GoldenPoolManagerProps) => {

  const table = useModal({
    content: <GoldenPoolTable data={props.data} onUpdate={props.onUpdate} />,
    title: '管理金池',
    footer: null,
    className: 'w-[980px]',
    onOpen: () => {
    }
  })

  return (
    <>
      <div className="cursor-pointer text-sm pr-2" onClick={() => table.modal.open()} onKeyDown={() => { }}>管理金池</div>
      {
        table.context
      }
    </>
  )
}

interface GoldenPoolTableProps {
  data: CollectCate[]
  onUpdate: () => void
}

const poolSchema = z.object({
  id: z.string(),
  name: z.string()
})

const GoldenPoolTable = (props: GoldenPoolTableProps) => {
  const columns: JknTableProps['columns'] = [
    {
      header: '序号',
      accessorKey: 'index',
      meta: { align: 'center', width: 60, },
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>
    },
    { header: '股票名称', accessorKey: 'name' },
    { header: '股票数量', accessorKey: 'total' },
    { header: '创建时间', accessorKey: 'create_time' },
    {
      header: '操作', accessorKey: 'opt', meta: { align: 'center', width: 120 },
      cell: ({ row }) => (
        <div className="flex items-center justify-around">
          <span className="cursor-pointer" onClick={() => edit.open(row.original)} onKeyDown={() => { }}>重命名</span>
          <span className="cursor-pointer" onClick={() => onDelete(row.original.id as string, row.original.name as string)} onKeyDown={() => { }}>删除</span>
        </div>
      )
    },
  ]
  const form = useZForm(poolSchema, {
    id: '',
    name: ''
  })
  const [title, setTitle] = useState('新建金池')
  const { toast } = useToast()

  const edit = useFormModal<typeof poolSchema>({
    content: <GoldenPoolForm />,
    title: title,
    form,
    onOk: async (values) => {
      const [err] = await to(values.id ? updateStockCollectCate(values) : addStockCollectCate(values.name))

      if (err) {
        toast({ description: err.message })
        return
      }
      edit.close()
      props.onUpdate()
    },
    onOpen: (values?: z.infer<typeof poolSchema>) => {
      if (values) {
        form.setValue('id', values.id)
        form.setValue('name', values.name)
      }

      setTitle(values ? '编辑金池' : '新建金池')
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

          props.onUpdate()
        }
      }

    })
  }

  return (
    <div >
      <div className="h-[480px]">
        <JknTable columns={columns} data={props.data} />
      </div>
      <div className="text-center mb-4">
        <Button onClick={() => edit.open()} variant="default">新建金池</Button>
      </div>
      {
        edit.context
      }
    </div>
  )
}


const GoldenPoolForm = () => {
  const form = useFormContext<z.infer<typeof poolSchema>>()

  return (
    <div className="p-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>金池名称</FormLabel>
            <FormControl>
              <Input placeholder="请输入金池名称" {...field} value={field.value} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  )
}

export default GoldenPool