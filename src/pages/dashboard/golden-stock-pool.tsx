import { useState } from "react"
import CapsuleTabs from "./components/capsule-tabs"
import { useTranslation } from "react-i18next"
import { Table } from "@/components"
import type { TableProps } from "antd"

const GoldenStockPool = () => {
  const [type, setType] = useState('golden')
  const { t } = useTranslation()

  const columns: TableProps['columns'] = [
    { title: '名称代码', dataIndex: 'name', sorter: true, showSorterTooltip: false},
    { title: '现价', sorter: true, align: 'right', showSorterTooltip: false },
    { title: '涨幅', sorter: true, align: 'right', showSorterTooltip: false },
    { title: '成交额', sorter: true, align: 'right', showSorterTooltip: false },
    { title: '总市值', sorter: true, align: 'right', showSorterTooltip: false },
  ]

  return (
    <div className="w-full h-full">
      <div className="border-style-primary px-1 py-2">
        <CapsuleTabs activeKey={type} onChange={(v) => setType(v)}>
          <CapsuleTabs.Tab value="golden" label={t('goldenStockPool')}>
          </CapsuleTabs.Tab>
        </CapsuleTabs>
      </div>
      <div className="h-[calc(100%-38px)]">
        <Table columns={columns} sortDirections={['descend', 'ascend']} />
      </div>
    </div>
  )
}

export default GoldenStockPool