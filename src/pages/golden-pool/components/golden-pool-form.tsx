import { FormControl, FormField, FormItem, FormLabel, Input } from '@/components'
import { useFormContext } from 'react-hook-form'
import { z } from 'zod'

export const poolSchema = z.object({
  id: z.string(),
  name: z.string()
})
export const GoldenPoolForm = () => {
  const form = useFormContext<z.infer<typeof poolSchema>>()

  return (
    <div className="p-4">
      <FormField
        control={form.control}
        name="id"
        render={({ field }) => (
          <FormItem hidden>
            <FormLabel>id</FormLabel>
            <FormControl>
              <Input placeholder="请输入自选名称" {...field} value={field.value} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>自选名称</FormLabel>
            <FormControl>
              <Input placeholder="请输入自选名称" {...field} value={field.value} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  )
}
