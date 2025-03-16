import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { JknTimeline } from '@/components';
import { getStockEconomic } from '@/api';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

/**
 * 财经数据项接口
 * @interface EconomicDataItem
 * @property {string} title - 标题
 * @property {string} publishTime - 发布时间
 */
interface EconomicDataItem {
  title: string;
  publishTime: string;
}

/**
 * 按日期分组的财经数据
 * @interface EconomicDateGroup
 * @property {string} date - 日期，格式为YYYY-MM-DD
 * @property {EconomicDataItem[]} items - 该日期下的财经数据项
 */
interface EconomicDateGroup {
  date: string;
  items: EconomicDataItem[];
}

/**
 * 财经数据内容组件
 * @param {EconomicDateGroup} group - 日期分组数据
 * @returns {React.ReactNode} 财经数据内容组件
 */
const EconomicContent: React.FC<{ group: EconomicDateGroup }> = ({ group }) => {
  const isCurrentOrFuture = dayjs(group.date).isSameOrAfter(dayjs(), 'day');
  
  // 根据日期状态设置颜色
  const colors = {
    date: isCurrentOrFuture ? "#FFFFFF" : "#575757",
    title: isCurrentOrFuture ? "#DBDBDB" : "#575757",
    time: isCurrentOrFuture ? "#808080" : "#575757"
  };
  
  return (
    <div>
      {/* 日期 */}
      <div className="text-2xl mt-[-10px]" style={{ color: colors.date }}>
        {dayjs(group.date).format("MM-DD W")}
      </div>
      <div>
        {group.items.map((item, index) => (
          <div key={index} className="py-5">
            {/* 标题 */}
            <div className="text-xl" style={{ color: colors.title }}>{item.title}</div>
            {/* 发布时间 */}
            <div className="text-base mt-[10px]" style={{ color: colors.time }}>{dayjs(item.publishTime).format('HH:mm')}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 财经时间轴组件
 * 展示按日期分组的财经数据
 * @returns {React.ReactNode} 财经时间轴组件
 */
const EconomicTimeline: React.FC = () => {
  // 分页状态管理
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const limit = 50; // 每页数据条数
  
  // 用于存储所有已加载的数据项
  const [allItems, setAllItems] = useState<any[]>([]);

  // 是否按升序排序
  const isAscending = false;

  // 使用 React Query 获取财经数据
  const { data, isFetching } = useQuery({
    queryKey: [getStockEconomic.cacheKey, page],
    queryFn: () => getStockEconomic({
      limit,
      page,
      type: 1,
      sort: isAscending ? 'ASC' : 'DESC'
    })
  });

  // 更新累积数据并检查是否还有更多数据可加载
  useEffect(() => {
    if (data) {
      // 将新数据追加到累积数据中
      if (data.items && data.items.length > 0) {
        // 确保不重复添加数据
        setAllItems(prevItems => {
          const newItems = data.items.filter(
            newItem => !prevItems.some(
              existingItem => existingItem.id === newItem.id
            )
          );
          
          return [...prevItems, ...newItems];
        });
      }
      
      // 检查是否还有更多数据可加载
      setHasMore(data.current < data.total_pages);
    }
  }, [data]);

  // 加载更多数据的回调函数
  const handleLoadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  }, [isFetching, hasMore]);

  // 将接口数据按日期分组并转换为组件所需格式
  const EconomicData = useMemo(() => {
    if (!allItems.length) return [];

    // 按日期分组
    const groupedByDate: Record<string, any[]> = {};
    
    allItems.forEach(item => {
      // 提取日期部分 (YYYY-MM-DD)
      const dateStr = item.date.split(' ')[0];
      
      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = [];
      }
      
      groupedByDate[dateStr].push(item);
    });

    // 转换为组件所需的格式并按日期升序排序
    return Object.keys(groupedByDate)
      .map(dateStr => {
        // 转换为组件所需的数据项格式
        const items: EconomicDataItem[] = groupedByDate[dateStr]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map(item => ({
            title: item.title,
            publishTime: item.date,
          }));
        
        return {
          date: dateStr,
          items,
        };
      })
      .sort((a, b) => (new Date(a.date).getTime() - new Date(b.date).getTime()) * (isAscending ? 1 : -1));
  }, [allItems]);

  // 将财经数据转换为时间轴数据
  const timelineItems = useMemo(() => {
    return EconomicData.map(group => {
      const isCurrentOrFuture = dayjs(group.date).isSameOrAfter(dayjs(), 'day');
      const primaryColor = 'hsl(var(--primary))';
      
      // 基础配置项
      const itemConfig = {
        content: <EconomicContent group={group} />
      };
      
      // 只有当日期大于等于今天时，才设置轴点颜色为主色
      return isCurrentOrFuture ? { ...itemConfig, dot: primaryColor } : itemConfig;
    });
  }, [EconomicData]);

  return (
    <div className="h-full">
      <JknTimeline
        className="pt-2 mt-8"
        items={timelineItems} 
        tailWidth={1}
        tailMarginRight={60}
        itemPaddingBottom={40}
        loading={isFetching}
        onLoadMore={handleLoadMore}
        loadMoreThreshold={100}
      />
    </div>
  );
};

export default EconomicTimeline;