import { createVote } from "@/api"
import { Button, FormControl, FormField, FormItem, FormLabel, Input, JknAlert, JknDatePicker, JknIcon, ScrollArea, Separator, StockPicker, Textarea } from "@/components"
import { useZForm } from "@/hooks"
import { useMutation } from "@tanstack/react-query"
import dayjs from "dayjs"
import { FormProvider, useFieldArray } from "react-hook-form"
import { z } from "zod"
import type { ChatChannel } from "../lib/types"

interface VoteFormProps {
  id?: number
  channel: ChatChannel
  onClose?: () => void
  onSubmit?: (data: z.infer<typeof voteSchema>) => void
}

const voteSchema = z.object({
  title: z.string().min(1, { message: "投票标题不能为空" }),
  desc: z.string().min(1, { message: '请输入投票详情' }),
  voteLimit: z.string().min(1, { message: '请输入每人可投票次数' }),
  items: z.array(z.object({
    title: z.string().optional(),
    id: z.number().optional()
  })).min(1, { message: "投票选项不能为空" })
    .refine((data) => {
      const titles = data.map(item => item.title)
      return new Set(titles).size === titles.length
    }, { message: "投票选项不能重复" })
    .refine((data) => {
      return data.every(item => item.title && item.title.length > 0)
    }, {
      message: "投票选项不能为空"
    }),
  endTime: z.string().min(1, { message: "投票截止时间不能为空" }),
})

export const VoteForm = ({ id, channel, onSubmit, onClose }: VoteFormProps) => {
  const form = useZForm(voteSchema, {
    title: '',
    items: [{ title: '', id: 0 }],
    endTime: '',
    desc: '',
    voteLimit: '1'
  })

  const optionsFields = useFieldArray({
    control: form.control,
    name: 'items'
  })

  const submit = useMutation({
    mutationFn: async () => {
      const r = await form.trigger()
      if (!r) {
        const error = Object.values(form.formState.errors)[0]
        throw new Error(error?.message ? error.message : error.root ? error.root.message : "未知错误")
      }

      const data = form.getValues()

      const params: FuncParams<typeof createVote>[0] = {
        title: data.title,
        items: data.items.map(item => ({
          title: item.title!,
          id: 0
        })),
        id,
        channel_account: channel.id,
        desc: data.desc,
        vote_limit: Number(data.voteLimit),
        start_time: Math.round(Date.now() / 1000),
        end_time: Math.round(dayjs(data.endTime).valueOf() / 1000),
        custom_item: 0
      }

      await createVote(params)

      onSubmit?.(data)
    },
    onError: (err) => {
      JknAlert.error(err.message)
    }
  })

  return (
    <div className="w-[538px] py-2">
      <FormProvider {...form}>
        <form className="px-5">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="pb-4 flex justify-center space-y-0">
                <FormLabel className="text-sm w-28 flex-shrink-0">投票标题</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="请输入投票名称" className="placeholder:text-tertiary h-10 rounded-md" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormItem className="flex justify-center space-y-0 pb-4">
            <FormLabel className="text-sm w-28 flex-shrink-0">投票选项</FormLabel>
            <ScrollArea className="h-[160px] w-full">
              <div className="space-y-4">
                {
                  optionsFields.fields.map((item, index) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name={`items.${index}.title`}
                      render={({ field }) => (
                        <FormItem className="flex justify-center space-y-0">
                          <FormControl>
                            <VoteStockPicker index={index}   {...field} onChange={(value) => { field.onChange(value) }} onAdd={() => optionsFields.append({ title: '', id: 0 })} onDelete={() => optionsFields.remove(index)} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))
                }
              </div>
            </ScrollArea>
          </FormItem>
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem className="pb-4 flex justify-center space-y-0">
                <FormLabel className="text-sm w-28 flex-shrink-0">投票截止时间</FormLabel>
                <FormControl>
                  <JknDatePicker time {...field} disabled={e => !dayjs().add(-1, 'day').isBefore(e)} >
                    {
                      (v) => (
                        <div className="h-10 flex w-full items-center justify-end box-border py-2 border border-solid border-input rounded-md px-2">
                          {
                            v ? (
                              <div className="text-sm text-foreground">{v}</div>
                            ) : (
                              <div className="text-sm text-tertiary">请选择截止时间</div>
                            )
                          }
                          &nbsp;
                          <JknIcon.Svg name="arrow-down" size={12} className="" />
                        </div>
                      )
                    }
                  </JknDatePicker>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="voteLimit"
            render={({ field }) => (
              <FormItem className="pb-4 flex justify-center space-y-0">
                <FormLabel className="text-sm w-28 flex-shrink-0">每人可投票次数</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="请输入每人可投票次数" className="placeholder:text-tertiary h-10 rounded-md" type="number" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="desc"
            render={({ field }) => (
              <FormItem className="pb-4 flex justify-center space-y-0">
                <FormLabel className="text-sm w-28 flex-shrink-0">投票详情</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="请输入投票详情" rows={3} className="placeholder:text-tertiary h-10 rounded-md" />
                </FormControl>
              </FormItem>
            )}
          />

        </form>
      </FormProvider>
      <div className="text-right space-x-4 pr-5 pb-5 h-10 flex items-center justify-end">
        <Button variant="outline" className="w-24 box-border" onClick={() => onClose?.()}>
          取消
        </Button>
        <Button className="w-24 box-border " onClick={() => submit.mutate()} loading={submit.isPending}>
          发起投票
        </Button>
      </div>
    </div>
  )
}

interface VoteStockPickerProps {
  index: number
  value?: string
  onChange: (value: string) => void
  onAdd: () => void
  onDelete: (index: number) => void
}

const VoteStockPicker = ({ index, value, onChange, onAdd, onDelete }: VoteStockPickerProps) => {
  return (
    <div className="flex-1 w-full h-10 flex items-center box-border py-2 border border-solid border-input rounded-md px-4">
      <StockPicker value={value} onChange={onChange} className="border-none p-0" outline={false} />
      <Separator orientation="vertical" className="mx-4" />
      {
        index > 0 ? (
          <JknIcon.Svg name="mins" className="w-3 h-3 p-1 cursor-pointer rounded-full border border-solid border-foreground text-foreground" onClick={() => onDelete(index)} />
        ) : (
          <JknIcon.Svg name="plus" className="w-3 h-3 p-1 cursor-pointer rounded-full border border-solid border-foreground text-foreground" onClick={onAdd} />
        )
      }
    </div>
  )
}