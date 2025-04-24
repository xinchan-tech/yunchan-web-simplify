import { FormControl, FormField, FormItem, FormLabel, Input, JknAlert, JknAvatar, JknIcon, JknImageUploader, JknModal, ScrollArea, SkeletonLoading, Textarea } from "@/components"
import type { ChatChannel } from "../lib/types"
import WKSDK, { Channel } from "wukongimjssdk"
import { ChannelTransform, SubscriberTransform } from "../lib/transform"
import { useMutation, useQuery } from "@tanstack/react-query"
import { GroupTag } from "./channel-list"
import { useUser } from "@/store"
import copy from "copy-to-clipboard"
import { z } from 'zod'
import { useZForm } from "@/hooks"
import { useEffect } from "react"
import { FormProvider } from "react-hook-form"
import { editGroupService } from "@/api"
import { useUnmount } from "ahooks"
import { syncChannelInfo } from "../lib/datasource"
import { chatEvent } from "../lib/event"

const SettingIcon = () => <JknIcon.Svg name="setting" hoverable className="p-1" size={12} />
// const InfoIcon = () => <JknIcon.Svg name="" hoverable className="p-1.5" />

interface ChannelInfoProps {
  channel: ChatChannel
}

export const ChannelInfo = ({ channel }: ChannelInfoProps) => {
  const channelInfo = useQuery({
    queryKey: ['channelInfo', channel.id],
    queryFn: async () => {
      await syncChannelInfo(channel)
      return ChannelTransform.toChatChannel(WKSDK.shared().channelManager.getChannelInfo(new Channel(channel.id, channel.type))!)
    },
    enabled: !!channel.id
  })
  const shareUrl = useUser(s => s.user?.share_url)

  const subscriber = useQuery({
    queryKey: ['subscriber', channel.id],
    queryFn: async () => {
      const _channel = new Channel(channel.id, channel.type)
      await WKSDK.shared().channelManager.syncSubscribes(_channel)
      return WKSDK.shared().channelManager.getSubscribes(_channel).map(SubscriberTransform.toChatSubscriber)
    },
    enabled: !!channel.id
  })

  const onSubmit = () => {
    channelInfo.refetch().then(r => {
      if(r.data){
        chatEvent.emit('updateChannel', r.data)
      }
    })
  }

  return (
    <JknModal title="社群信息" trigger={<SettingIcon />} footer={null}>
      <div className="w-[668px] h-[590px] box-border px-5">
        {
          channelInfo.isLoading ? (
            <SkeletonLoading count={12} />
          ) : (
            <>
              <div className="flex w-full flex-col items-center space-y-2.5">
                <JknAvatar className="size-24" src={channelInfo.data?.avatar} title={channelInfo.data?.name} />
                <div className="flex items-center">
                  {channelInfo.data?.name}&nbsp;
                  {
                    channelInfo.data?.editable ? (
                      <EditChannelForm channel={channelInfo.data} onOk={onSubmit} />
                    ) : null
                  }
                </div>
                <GroupTag total={channelInfo.data?.userNum} showMember tags={channelInfo.data?.tags || ''} />
              </div>
              <div className="mt-4 px-12 text-muted-foreground flex items-center border-0 border-t border-b border-solid border-border py-3">
                <span className="flex-shrink-0">人数上限：{channelInfo.data?.maxCount ?? '--'}人</span>
                &emsp;&emsp;&emsp;&emsp;
                <span className="flex-shrink-0 ml-auto">邀请链接：</span>
                <span className="line-clamp-1 text-tertiary w-[200px]">{shareUrl}</span>
                <JknIcon.Svg
                  name="copy"
                  className="text-tertiary cursor-pointer"
                  size={20}
                  onClick={() => {
                    if (shareUrl) {
                      copy(`${shareUrl}&cid=${channel.id}`)
                      JknAlert.success('复制成功')
                    }
                  }}
                />
              </div>
              <div className="mt-4 flex justify-start flex-1">
                <div className="flex-1">
                  <div>群公告</div>
                  <ScrollArea className="h-[280px]">
                    <pre className="text-sm text-tertiary">
                      {channelInfo.data?.notice || ''}
                    </pre>
                  </ScrollArea>
                </div>
                <div className="w-64 h-full">
                  <div className="mb-2.5">全部成员</div>
                  <ScrollArea className="border border-solid border-border rounded h-[280px]">
                    {
                      subscriber.isLoading ? (
                        <SkeletonLoading count={12} />
                      ) : (
                        <div className="flex flex-col box-border p-2">
                          {
                            subscriber.data?.map(item => (
                              <div key={item.id} className="flex items-center mb-2.5 hover:bg-accent cursor-pointer">
                                <JknAvatar className="size-6" src={item.avatar} title={item.name} />&nbsp;
                                <span className="text-sm">{item.name}</span>
                              </div>
                            ))
                          }
                        </div>
                      )
                    }
                  </ScrollArea>
                </div>
              </div>
            </>
          )
        }
      </div>
    </JknModal>
  )
}

interface EditChannelFormProps {
  channel: ChatChannel
  onOk: () => void
}

const channelFormSchema = z.object({
  logo: z.string().optional(),
  name: z.string().min(1, { message: '请输入社群名称' }),
  tags: z.string().optional(),
  brief: z.string().optional(),
  notice: z.string().optional(),
  maxCount: z.string().optional(),
})

export const EditChannelForm = ({ channel, onOk }: EditChannelFormProps) => {
  const form = useZForm(channelFormSchema, {
    name: "",
    maxCount: '0'
  })


  useEffect(() => {
    form.setValue('logo', channel.avatar)
    form.setValue('name', channel.name)
    form.setValue('tags', channel.tags)
    form.setValue('brief', channel.brief)
    form.setValue('notice', channel.notice)
    form.setValue('maxCount', channel.maxCount.toString())

  }, [channel, form.setValue])


  const submitMun = useMutation({
    mutationFn: async () => {
      const r = await form.trigger()

      if(!r){
        throw new Error('请检查输入')
      }

      const data = form.getValues()

      const params ={
        ...data,
        avatar: data.logo,
        account: channel.id,
      }

      await editGroupService(params)

      return true
    },
    onError: (err) => {
      console.error(err)
      JknAlert.error('编辑失败')
    },
    onSuccess: () => {
      onOk()
      JknAlert.success('编辑成功')
    }
  })

  const onClose = () => {
    form.setValue('logo', channel.avatar)
    form.setValue('name', channel.name)
    form.setValue('tags', channel.tags)
    form.setValue('brief', channel.brief)
    form.setValue('notice', channel.notice)
    form.setValue('maxCount', channel.maxCount.toString())
  }

  return (
    <JknModal title="编辑社群" trigger={
      <JknIcon.Svg
        name="edit"
        hoverable
        className="p-1"
        size={12}
        label="编辑社群"
      />
    }
      onOk={() => submitMun.mutateAsync()}
      className="w-[640px]"
      onClose={onClose}
      background="rgb(0, 0, 0, 0.4)"
      confirmLoading={submitMun.isPending}
    >
      <FormProvider {...form}>
        <form className="px-5">
          <FormField
            control={form.control}
            name="logo"
            render={({ field }) => (
              <FormItem className="pb-4 flex justify-center space-y-0">
                <FormControl>
                  <JknImageUploader src={field.value} onChange={field.onChange} title="上传社群头像">
                    <JknAvatar className="size-24" src={field.value}  title={channel.name} />
                  </JknImageUploader>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="pb-4 flex justify-center space-y-0">
                <FormLabel className="w-32 text-base font-normal">社群名称</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="请输入社群名称" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem className="pb-4 flex justify-center space-y-0">
                <FormLabel className="w-32 text-base font-normal">社群标签</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="请输入社群标签， 用逗号进行分隔" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxCount"
            render={({ field }) => (
              <FormItem className="pb-4 flex justify-center space-y-0">
                <FormLabel className="w-32 text-base font-normal">会员上限</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="请输入会员上限" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="brief"
            render={({ field }) => (
              <FormItem className="pb-4 flex justify-center space-y-0">
                <FormLabel className="w-32 text-base font-normal">社群简介</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} placeholder="请输入社群简介" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notice"
            render={({ field }) => (
              <FormItem className="pb-4 flex justify-center space-y-0">
                <FormLabel className="w-32 text-base font-normal">社群公告</FormLabel>
                <FormControl>
                  <Textarea rows={6} {...field} placeholder="请输入社群公告" />
                </FormControl>
              </FormItem>
            )}
          />


        </form>
      </FormProvider>
    </JknModal>
  )
}