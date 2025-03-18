import { getPlateList } from '@/api'
import { JknRcTable, type JknRcTableProps, SubscribeSpan } from '@/components'
import { useTableData } from '@/hooks'
import { useQuery } from '@tanstack/react-query'
import Decimal from 'decimal.js'
import { useEffect, useMemo } from 'react'

/**
 * SectorTable组件的属性类型
 */
interface SectorTableProps {
  /**
   * 板块类型：1-行业板块，2-概念板块
   */
  type: 1 | 2
}

/**
 * 板块数据类型
 */
export type PlateDataType = {
  /**
   * 板块ID
   */
  id: string
  /**
   * 板块名称
   */
  name: string
  /**
   * 涨跌幅
   */
  change: number
  /**
   * 成交额
   */
  amount: number
  /**
   * 上涨家数
   */
  hot_rise: number
  /**
   * 涨跌幅(转换后)
   */
  percent: number
}

/**
 * 板块表格组件
 * @description 用于展示行业板块或概念板块的数据
 */
const SectorTable = (props: SectorTableProps) => {
  // 获取板块数据
  const plateQuery = useQuery({
    queryKey: [getPlateList.cacheKey, props.type],
    queryFn: () => getPlateList(props.type)
  })

  // 使用useTableData处理表格数据和排序
  const [list, { setList, onSort }] = useTableData<PlateDataType>([], 'id')

  // 当数据更新时，更新表格数据
  useEffect(() => {
    if (plateQuery.data) {
      setList(plateQuery.data.map(item => ({
        ...item,
        percent: item.change / 100
      })))
    }
  }, [plateQuery.data, setList])

  // 定义表格列配置
  const columns = useMemo<JknRcTableProps<PlateDataType>['columns']>(
    () => [
      {
        title: '板块名称',
        dataIndex: 'name',
        align: 'left',
        width: '33.3%',
        sort: true,
        render: name => <span className="inline-block h-[33px]">{name}</span>
      },
      {
        title: '涨跌幅',
        dataIndex: 'change',
        sort: true,
        align: 'left',
        width: '33.3%',
        render: (_, row) => (
          <SubscribeSpan.PercentBlink
            subscribe={false}
            showSign
            symbol=""
            decimal={2}
            initValue={row.percent}
            initDirection={row.change > 0}
            zeroText="0.00%"
            nanText="--"
          />
        )
      },
      {
        title: '成交额',
        dataIndex: 'amount',
        sort: true,
        align: 'right',
        width: '33.3%',
        render: (_, row) => (
          <span className='inline-block leading-6'>
            {Decimal.create(row.amount).toShortCN()}
          </span>
        )
      },
    ],
    []
  )

  return (
    <JknRcTable
      headerHeight={48}
      rowKey="id"
      columns={columns}
      data={list}
      onSort={onSort}
      isLoading={plateQuery.isLoading}
      onRow={() => ({
        onClick: undefined
      })}
    />
  )
}

export default SectorTable
