import { getCalendarEvents } from '@/api'
import { JknTimeline } from '@/components'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type React from 'react'
import { useMemo } from 'react'

/**
 * 财经数据项接口
 * @interface EconomicDataItem
 * @property {string} title - 标题
 * @property {string} publishTime - 发布时间
 */
interface EconomicDataItem {
  title: string
  publishTime: string
}

/**
 * 按日期分组的财经数据
 * @interface EconomicDateGroup
 * @property {string} date - 日期，格式为YYYY-MM-DD
 * @property {EconomicDataItem[]} items - 该日期下的财经数据项
 */
interface EconomicDateGroup {
  date: string
  items: EconomicDataItem[]
}

/**
 * 财经数据内容组件
 * @param {EconomicDateGroup} group - 日期分组数据
 * @param {boolean} isFirst - 是否为时间轴中的第一个数据
 * @returns {React.ReactNode} 财经数据内容组件
 */
const EconomicContent: React.FC<{ group: EconomicDateGroup; isFirst?: boolean }> = ({ group, isFirst = false }) => {
  const isCurrentOrFuture = dayjs(group.date).isSameOrAfter(dayjs(), 'day')

  // 根据日期状态设置颜色
  const colors = {
    date: isCurrentOrFuture ? '#FFFFFF' : '#575757',
    title: isCurrentOrFuture ? '#DBDBDB' : '#575757',
    time: isCurrentOrFuture ? '#808080' : '#575757'
  }

  return (
    <div>
      {/* 日期 - 当为第一个数据项时不使用mt-[-10px]样式 */}
      <div className={`text-xl ${isFirst ? '' : 'mt-[-8px]'}`} style={{ color: colors.date }}>
        {dayjs(group.date).format('MM-DD W')}
      </div>
      <div>
        {group.items.map((item, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <div key={index} className="py-5">
            {/* 标题 */}
            <div className="text-base" style={{ color: colors.title }}>
              {item.title}
            </div>
            {/* 发布时间 */}
            <div className="text-sm mt-[10px]" style={{ color: colors.time }}>
              {dayjs(item.publishTime).format('HH:mm')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 财经时间轴组件
 * 展示按日期分组的财经数据
 * @returns {React.ReactNode} 财经时间轴组件
 */
const EconomicTimeline: React.FC = () => {
  // 使用 React Query 获取财经日历事件数据
  const { data, isLoading } = useQuery({
    queryKey: [getCalendarEvents.cacheKey],
    queryFn: () => getCalendarEvents()
  })

  // 将接口数据转换为组件所需格式
  const EconomicData = useMemo(() => {
    if (!data || !data.length) return []

    // 直接将接口返回的数据转换为组件所需格式
    return data.map(eventGroup => {
      // 提取日期（假设所有values中的事件都在同一天）
      // 如果values为空，则使用当前日期
      const date =
        eventGroup.values.length > 0 ? eventGroup.values[0].datetime.split(' ')[0] : dayjs().format('YYYY-MM-DD')

      // 转换为组件所需的数据项格式
      const items: EconomicDataItem[] = eventGroup.values.map(event => ({
        title: event.title,
        publishTime: event.datetime
      }))

      return {
        date,
        items
      }
    })
  }, [data])

  // 将财经数据转换为时间轴数据
  const timelineItems = useMemo(() => {
    return EconomicData.map((group, index) => {
      const isCurrentOrFuture = dayjs(group.date).isSameOrAfter(dayjs(), 'day')
      const primaryColor = 'hsl(var(--primary))'

      // 基础配置项
      const itemConfig = {
        content: <EconomicContent group={group} isFirst={index === 0} />
      }

      // 只有当日期大于等于今天时，才设置轴点颜色为主色
      return isCurrentOrFuture ? { ...itemConfig, dot: primaryColor } : itemConfig
    })
  }, [EconomicData])

  return (
    <div className="h-full mt-10">
      <JknTimeline
        items={timelineItems}
        dotFirstPaddingTop={8}
        tailWidth={1}
        tailMarginRight={60}
        itemPaddingBottom={40}
        loading={isLoading}
      />
    </div>
  )
}

export default EconomicTimeline
