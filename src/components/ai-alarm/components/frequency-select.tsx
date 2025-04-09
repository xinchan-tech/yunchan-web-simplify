import { Tabs, TabsList, TabsTrigger } from '@/components'
import { forwardRef } from 'react'

interface FrequencySelectProps {
  value?: string
  onChange?: (value: string) => void
}
export const FrequencySelect = forwardRef((props: FrequencySelectProps, _) => {
  return (
    <div className="ml-auto">
      <Tabs value={props.value} onValueChange={props.onChange}>
        <TabsList>
          <TabsTrigger value="0" asChild className="h-9 w-[160px] box-border">
            <span>仅提醒一次</span>
          </TabsTrigger>
          <TabsTrigger value="1" asChild className="h-9 w-[160px] box-border">
            <span>持续提醒</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
})
