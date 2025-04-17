import { Button, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Input } from '@/components'
import { useToast, useZForm } from '@/hooks'
import { useIndicator } from '@/store'
import Decimal from 'decimal.js'
import { useEffect, useState } from 'react'
import { Form, FormProvider, useFieldArray } from 'react-hook-form'
import { z } from 'zod'

const indicatorParamsSchema = z.object({
  params: z.array(
    z
      .object({
        min: z.string().optional(),
        max: z.string().optional(),
        default: z.string(),
        name: z.string(),
        value: z.string()
      })
      .refine(
        v => {
          if (!v.value) return false
          console.log(v, v.min)
          if (v.min && Decimal.create(v.value).lt(v.min)) return false

          if (v.max && Decimal.create(v.value).gt(v.max)) return false

          return true
        },
        { message: '参数值不在范围内' }
      )
  )
})

export const IndicatorParamsForm = () => {
  const { indicatorParams, setIndicatorParams } = useIndicator()
  const form = useZForm(indicatorParamsSchema, {
    params: []
  })
  const [indicator, setIndicator] = useState(indicatorParams[0].id)
  const arrayFields = useFieldArray({
    control: form.control,
    name: 'params'
  })

  useEffect(() => {
    const params = indicatorParams.find(item => item.id === indicator)?.params ?? []
    form.setValue('params', params)
  }, [indicator, indicatorParams, form])

  const onResetDefault = () => {
    const params = indicatorParams.find(item => item.id === indicator)?.params ?? []
    form.setValue(
      'params',
      params.map(item => ({ ...item, value: item.default }))
    )
  }

  const { toast } = useToast()

  const submitParams = async () => {
    const valid = await form.trigger()

    if (!valid) {
      for (const err of Object.keys(form.formState.errors) as unknown as (keyof typeof form.formState.errors)[]) {
        toast({ description: (form.formState.errors[err] as any)[0].root.message })
        return
      }
    }

    const values = form.getValues()

    setIndicatorParams({
      id: indicator,
      params: values.params
    })

    toast({ description: '保存成功' })
  }

  return (
    <div className="flex text-sm">
      <div className="h-[50vh] overflow-y-auto">
        {indicatorParams.map(item => (
          <div
            key={item.id}
            className="data-[state=active]:bg-accent hover:!bg-primary py-2 w-60 px-2 box-border"
            data-state={indicator === item.id ? 'active' : ''}
            onClick={() => setIndicator(item.id)}
            onKeyDown={() => {}}
          >
            {item.name}
          </div>
        ))}
      </div>
      <div className="w-96 h-[50vh] overflow-y-auto box-border p-4">
        <div className="mb-4">参数列表</div>
        <FormProvider {...form}>
          <form className="space-y-4">
            {arrayFields.fields.map((field, index) => {
              return (
                <FormField
                  key={field.id}
                  control={form.control}
                  rules={{ min: 1 }}
                  name={`params.${index}.value`}
                  render={({ field }) => {
                    const name = arrayFields.fields[index].name
                    const param = indicatorParams
                      .find(item => item.id === indicator)
                      ?.params.find(item => item.name === name)
                    return (
                      <FormItem>
                        <FormLabel className="font-normal">
                          参数名：&nbsp;&nbsp;{name}{' '}
                          <span className="text-xs text-tertiary">
                            (默认:{param?.default}, 最小:{param?.min}, 最大:{param?.max})
                          </span>
                        </FormLabel>
                        <div className="flex items-center">
                          <span className="w-20">参数值：</span>
                          <FormControl>
                            <Input className="border-border" size="sm" {...field} />
                          </FormControl>
                        </div>
                        <FormDescription />
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
              )
            })}
          </form>
          <div
            className="hover:text-primary cursor-pointer mt-2 text-xs text-tertiary"
            onClick={onResetDefault}
            onKeyDown={() => {}}
          >
            恢复默认值
          </div>
        </FormProvider>
        <div className=" text-center mt-4">
          <Button size="sm" className="w-24" onClick={submitParams}>
            保存
          </Button>
        </div>
      </div>
    </div>
  )
}
