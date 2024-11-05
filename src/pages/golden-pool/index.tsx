import { type StockExtend, addStockCollectCate, getStockCollectCates, getStockCollects, removeStockCollect, removeStockCollectCate, updateStockCollectCate } from "@/api"
import { CapsuleTabs, JknModal, JknTable, useFormModal, useModal } from "@/components"
import { useDomSize } from "@/hooks"
import { useStock, useTime } from "@/store"
import { numToFixed, priceToCnUnit } from "@/utils/price"
import { cn } from "@/utils/style"
import { DeleteOutlined, PlusSquareOutlined, SettingFilled } from "@ant-design/icons"
import { useRequest } from "ahooks"
import { Button, Checkbox, Form, Input, Modal, Popover, Skeleton, type CheckboxProps, type TableProps } from "antd"
import to from "await-to-js"
import Decimal from "decimal.js"
import { useMemo, useState } from "react"
import { useImmer } from "use-immer"

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

  const onCheckAllChange: CheckboxProps['onChange'] = (e) => {
    setCheck(d => {
      d.all = e.target.checked
      d.selected = e.target.checked ? data?.map(d => d.key) ?? [] : []
    })
  }

  const onRemove = async (code: string, name: string) => {
    if (!activeStock) return
    JknModal.confirm({
      title: '确认移除',
      content: <div className="text-center mt-4">确认将 {name} 移出金池?</div>,
      okText: '确认',
      onOk: async () => {
        const [err] = await to(removeStockCollect({ symbols: [code], cate_ids: [+activeStock] }))

        if (err) {
          JknModal.info({ content: err.message })
          return
        }

        collects.refresh()
      }
    })
  }

  const onRemoveBatch = async () => {
    if (!activeStock) return
    JknModal.confirm({
      title: '批量操作',
      content: <div className="text-center mt-4">确定该操作?</div>,
      okText: '确认',
      onOk: async () => {
        const [err] = await to(removeStockCollect({ symbols: check.selected, cate_ids: [+activeStock] }))

        if (err) {
          JknModal.info({ content: err.message })
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


  const columns: TableProps['columns'] = [
    { title: '序号', dataIndex: 'index', width: 60, align: 'center' },
    {
      title: '名称代码', dataIndex: 'name', sorter: true, showSorterTooltip: false,
      width: '25%',
      render: (_, row) => (
        <div className="overflow-hidden">
          <div className="text-secondary">{row.code}</div>
          <div className="text-tertiary text-xs text-ellipsis overflow-hidden whitespace-nowrap w-full">{row.name}</div>
        </div>
      )

    },
    {
      title: '现价', dataIndex: 'price', sorter: true, align: 'right', showSorterTooltip: false, width: '17%',
      render: (v, row) => <span className={cn(row.percent >= 0 ? 'text-stock-up' : 'text-stock-down')}>
        {numToFixed(v)}
      </span>
    },
    {
      title: '涨跌幅', dataIndex: 'percent', sorter: true, align: 'right', showSorterTooltip: false, width: '22%',
      render: v => (
        <div className={cn(v >= 0 ? 'bg-stock-up' : 'bg-stock-down', 'h-full rounded-sm w-16 text-center px-1 py-0.5 float-right')}>
          {v > 0 ? '+' : null}{`${numToFixed(v * 100, 2)}%`}
        </div>
      )
    },
    {
      title: '成交额', dataIndex: 'turnover', sorter: true, align: 'right', showSorterTooltip: false, width: '17%',
      render: (v) => <span>
        {priceToCnUnit(v * 10000, 2)}
      </span>
    },
    {
      title: '总市值', dataIndex: 'marketValue', sorter: true, align: 'right', showSorterTooltip: false, width: '19%',
      render: (v) => <span>
        {priceToCnUnit(v, 2)}
      </span>
    },
    {
      title: '换手率', dataIndex: '', sorter: true, align: 'right', showSorterTooltip: false, width: '19%',
      render: () => '0.00%'
    },
    // TODO: 待计算公式
    {
      title: '市盈率', dataIndex: 'pe', sorter: true, align: 'right', showSorterTooltip: false, width: '19%',
      render: (v) => <span>
        {numToFixed(v, 2)}
      </span>
    },
    {
      title: '行业板块', dataIndex: 'dataIndex', sorter: true, align: 'right', showSorterTooltip: false, width: '19%',
    },
    {
      title: '+AI报警', dataIndex: 'marketValue', align: 'center', width: 80,
      render: () => (
        <div className="text-stock-up cursor-pointer">
          <PlusSquareOutlined size={48} />
        </div>
      )
    },
    {
      title: (
        <Popover
          open={check.selected.length > 0}
          placement="bottomRight"
          overlayClassName="rounded-md border-style-secondary overflow-hidden"
          content={(
            <div className="bg-secondary rounded">
              <div className="bg-primary px-16 py-2">批量操作 {check.selected.length} 项</div>
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
          )}
        >
          移除
        </Popover>
      ), dataIndex: 'marketValue', align: 'center', width: 60,
      render: (_, row) => (
        <div className="cursor-pointer text-tertiary">
          <DeleteOutlined size={48} onClick={() => onRemove(row.code, row.name)} />
        </div>
      )
    },
    {
      title: <Checkbox checked={check.all} onChange={onCheckAllChange} />, align: 'center', width: 60,
      render: (_, row) => (
        <Checkbox checked={check.selected.includes(row.code)} onChange={() => onCheckboxClick(row.code)} />
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
        <Skeleton loading={collects.loading && !collects.data} active paragraph={{ rows: 10 }}>
          <JknTable rowKey="key" pagination={false} scroll={{ y: (size?.height ?? 60) - 30 }} columns={columns} dataSource={data} />
        </Skeleton>
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
    width: 800,
    title: '管理金池',
    footer: false,
    centered: true,
    maskClosable: true,
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

const GoldenPoolTable = (props: GoldenPoolTableProps) => {
  const columns: TableProps['columns'] = [
    { title: '序号', align: 'center', width: 60, render: (_, __, index) => <div className="text-center">{index + 1}</div> },
    { title: '股票名称', dataIndex: 'name' },
    { title: '股票数量', dataIndex: 'total' },
    { title: '创建时间', dataIndex: 'create_time' },
    {
      title: '操作', align: 'center', width: 120, render: (_, row) => (
        <div className="flex items-center justify-around">
          <span onClick={() => edit.open(row)} onKeyDown={() => { }}>重命名</span>
          <span onClick={() => onDelete(row.id, row.name)} onKeyDown={() => { }}>删除</span>
        </div>
      )
    },
  ]

  const [title, setTitle] = useState('新建金池')

  const edit = useFormModal({
    content: <GoldenPoolForm />,
    title: title,
    width: 400,
    centered: true,
    maskClosable: true,
    onOk: async (values) => {
      const [err] = await to(values.id ? updateStockCollectCate(values) : addStockCollectCate(values.name))

      if (err) {
        JknModal.info({ content: err.message })
        return
      }
      edit.close()
      props.onUpdate()
    },
    onOpen: (values) => {
      edit.form.setFieldsValue(values)
      setTitle(values ? '编辑金池' : '新建金池')
    }
  })

  const onDelete = (id: string, name: string) => {
    JknModal.confirm({
      title: '删除金池',
      content: `确定删除 ${name}？`,
      okText: '删除',
      cancelText: '取消',
      onOk: async () => {
        const [err] = await to(removeStockCollectCate(id))

        if (err) {
          JknModal.info({ content: err.message })
          return
        }

        props.onUpdate()
      }
    })
  }

  return (
    <div >
      <div className="h-[480px]">
        <JknTable pagination={false} scroll={{ y: 400 }} columns={columns} dataSource={props.data} />
      </div>
      <div className="text-center">
        <Button onClick={() => edit.open()} type="primary">新建金池</Button>
      </div>
      {
        edit.context
      }
    </div>
  )
}


const GoldenPoolForm = () => {
  return (
    <div className="p-4">
      <Form.Item layout="vertical" label="" name="id" hidden>
        <Input placeholder="" />
      </Form.Item>
      <Form.Item layout="vertical" label="金池名称" name="name">
        <Input placeholder="请输入金池名称" />
      </Form.Item>
    </div>
  )
}

export default GoldenPool