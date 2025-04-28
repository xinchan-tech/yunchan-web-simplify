import { createVote, getVoteDetail } from "@/api"
import { Button, FormControl, FormField, FormItem, FormLabel, Input, JknAlert, JknDatePicker, JknIcon, ScrollArea, Separator, SkeletonLoading, StockPicker, Textarea, ToggleGroup, ToggleGroupItem } from "@/components"
import { useZForm } from "@/hooks"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import { FormProvider, useFieldArray } from "react-hook-form"
import { z } from "zod"
import type { ChatChannel } from "../lib/types"
import { useEffect } from "react"

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
      return data.every(item => item.title && item.title.length > 0)
    }, {
      message: "投票选项不能为空"
    })
    .refine((data) => {
      const titles = data.map(item => item.title)
      return new Set(titles).size === titles.length
    }, { message: "投票选项不能重复" })
  ,
  endTime: z.string().min(1, { message: "投票截止时间不能为空" }),
  custom: z.number({ message: '自定义选项不能为空' }).default(0)
})

export const VoteForm = ({ id, channel, onSubmit, onClose }: VoteFormProps) => {
  const detail = useQuery({
    queryKey: [getVoteDetail.cacheKey, id],
    queryFn: async () => {
      if (!id) return
      return getVoteDetail(id.toString())
    },
    enabled: !!id
  })
  const queryClient = useQueryClient()

  useEffect(() => {
    // console.log(detail.data)
    if (detail.data) {
      form.setValue('title', detail.data.title)
      form.setValue('desc', detail.data.desc)
      form.setValue('voteLimit', detail.data.vote_limit.toString())
      form.setValue('endTime', dayjs(detail.data.end_time * 1000).format('YYYY-MM-DD HH:mm'))
      form.setValue('custom', detail.data.custom_item)
      // form.setValue('items', [{title: ''}, {title: '1'}])
      // optionsFields.remove(0)
      // console.log(detail.data)
      // detail.data.items.forEach(item => {
      //   optionsFields.append({ title: item.title, id: item.id })
      // })
      optionsFields.replace(detail.data.items.map(item => ({ title: item.title, id: item.id })))
    }
  }, [detail.data])

  const form = useZForm(voteSchema, {
    title: '',
    items: [{ title: '', id: 0 }],
    endTime: '',
    desc: '',
    voteLimit: '1',
    custom: 0
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
          id: item.id ?? 0
        })),
        id,
        channel_account: channel.id,
        desc: data.desc,
        vote_limit: Number(data.voteLimit),
        start_time: Math.round(Date.now() / 1000),
        end_time: Math.round(dayjs(data.endTime).valueOf() / 1000),
        custom_item: +data.custom
      }

      await createVote(params)

      if (id) {
        queryClient.invalidateQueries({ queryKey: [getVoteDetail.cacheKey, id] })
      }
      onSubmit?.(data)
    },
    onError: (err) => {
      JknAlert.error(err.message)
    }
  })

  return (
    <div className="w-[538px] py-2">
      {
        detail.isLoading ? (
          <SkeletonLoading count={8} />
        ) : (
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
                      <JknDatePicker time date={field.value} onChange={field.onChange} disabled={e => !dayjs().add(-1, 'day').isBefore(e)} popover={{ side: 'left' }}>
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
                name="custom"
                render={({ field }) => (
                  <FormItem className="pb-4 flex justify-center space-y-0">
                    <FormLabel className="text-sm w-28 flex-shrink-0">自定义选项</FormLabel>
                    <FormControl>
                      <ToggleGroup
                        hoverColor="#2E2E2E"
                        activeColor="#2E2E2E"
                        variant="ghost"
                        value={field.value.toString()} onValueChange={v => field.onChange(+v)} type="single" className="flex items-center space-x-4 flex-1 justify-end">
                        <ToggleGroupItem value="1" className="w-24 h-10 rounded-md">
                          <span className="text-sm text-tertiary">是</span>
                        </ToggleGroupItem>
                        <ToggleGroupItem value="0" className="w-24 h-10 rounded-md">
                          <span className="text-sm text-tertiary">否</span>
                        </ToggleGroupItem>
                      </ToggleGroup>
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
        )
      }
      <div className="text-right space-x-4 pr-5 pb-5 h-10 flex items-center justify-end">
        <Button variant="outline" className="w-24 box-border" onClick={() => onClose?.()}>
          取消
        </Button>
        <Button className="w-24 box-border " onClick={() => submit.mutate()} loading={submit.isPending}>
          {
            id ? '修改投票' : '发起投票'
          }
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