import {
  getAlarmLogUnreadCount
} from '@/api'
import {
  JknBadge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { StockAlarmList } from "./alarm-list"
import { StockAlarmRecordList } from "./record-list"

const StockAlarmPage = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'log'>('list')

  const unRead = useQuery({
    queryKey: [getAlarmLogUnreadCount.cacheKey],
    queryFn: getAlarmLogUnreadCount
  })

  const onTabClick = (tab: 'list' | 'log') => {
    setActiveTab(tab)
  }

  return (
    <div className="rounded-xs bg-background h-full overflow-hidden ml-1 w-[calc(100%-4px)]">
      <div className="text-center h-full py-5 box-border">
        <Tabs value={activeTab} onValueChange={onTabClick as any} className="h-full flex flex-col">
          <TabsList variant="flat" className="w-[calc(100%-2rem)] mx-auto overflow-hidden">
            <TabsTrigger value={'list'} asChild>
              <span className="flex-1 overflow-hidden ">
                &emsp;警报列表
                &emsp;
              </span>
            </TabsTrigger>
            <TabsTrigger value={'log'} asChild>
              <span className="flex-1 overflow-hidden relative">
                <span className="relative">
                  触发日志
                  {
                    unRead.data && unRead.data.count > 0 ? (
                      <JknBadge.Number number={unRead.data.count} className="absolute right-0 top-0 translate-x-full" />
                    ) : null
                  }
                </span>
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="flex-1 overflow-hidden">
            <StockAlarmList />
          </TabsContent>
          <TabsContent value="log" className="flex-1 overflow-hidden">
            <StockAlarmRecordList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}




export default StockAlarmPage
