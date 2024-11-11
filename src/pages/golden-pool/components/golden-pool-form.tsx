import { FormField, FormItem, FormLabel, FormControl, Input } from "@/components"
import { useFormContext } from "react-hook-form"
import { z } from "zod"

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