import { JknIcon, FormField, Textarea, FormControl, FormItem, Button, } from "@/components"
import { FormProvider, useForm } from "react-hook-form"

interface MessageInputProps {
  onSend: (message: string) => void
}

export const MessageInput = (props: MessageInputProps) => {
  const form = useForm()

  const _onSend = () => {
    const values = form.getValues()
    if(!values.message) return

    props.onSend(values.message)
    form.setValue('message', '')
  }



  return (
    <div className="py-4 h-[170px] p-4 box-border flex flex-col">
      <div>
        <JknIcon name="pick_image" className="rounded-none" onClick={() => {}} />
      </div>
      <div className="flex justify-stretch flex-1 overflow-hidden h-full">
        <FormProvider {...form}>
          <form className="w-full">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="h-full">
                  <FormControl>
                    <Textarea className="h-full w-full box-border" placeholder="请输入消息" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </FormProvider>
        <Button className="ml-3 h-full w-24" onClick={_onSend}>发送</Button>
      </div>
    </div>
  )
}