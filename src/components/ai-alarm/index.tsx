import { useEffect, type PropsWithChildren } from "react"
import { Button } from "../ui/button"
import AiAlarmSetting from "./ai-alarm-setting"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Cross2Icon } from "@radix-ui/react-icons"
import AiAlarmForm from "./ai-alarm-form"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import PriceAlarmForm from "./price-alarm-form"
import { PriceAlarmSetting } from "./price-alarm-setting"
import { useBoolean } from "ahooks"

interface AiAlarmProps {
  code?: string
}
export const AiAlarm = (props: PropsWithChildren<AiAlarmProps>) => {
  const [open, { setTrue, setFalse }] = useBoolean(false)
  const [visible, { setTrue: setVisibleTrue, setFalse: setVisibleFalse }] = useBoolean(false)

  useEffect(() => {
    if (open) {
      setVisibleTrue()
    } else {
      setTimeout(() => {
        setVisibleFalse()
      }, 250)
    }
  }, [open, setVisibleFalse, setVisibleTrue])


  return (
    <>
      <div className="w-auto h-auto" onClick={setTrue} onKeyDown={() => { }}>
        {
          props.children
        }
      </div>
      {
        visible ? (
          <Dialog open={open} onOpenChange={v => !v && setFalse()} modal={true}>
            <DialogContent className="w-[900px]">
              <DialogHeader>
                <DialogTitle asChild>
                  <div className="title text-center h-10" style={{}}>
                    <DialogClose asChild>
                      <span
                        className="bg-[#F36059] box-border rounded-full cursor-pointer  hover:opacity-90 absolute -z-0 w-4 h-4 left-2 top-3 flex items-center justify-center"
                        onKeyDown={() => { }}
                      >
                        <Cross2Icon className="scale-75" />
                      </span>
                    </DialogClose>
                    <span className="leading-[40px]">AI报警设置</span>
                  </div>
                </DialogTitle>
                <VisuallyHidden>
                  <DialogDescription />
                </VisuallyHidden>
              </DialogHeader>
              <div >
                <AiAlarmForm code={props.code} />
              </div>
            </DialogContent>
          </Dialog>
        ) : null
      }
    </>
  )
}


export const PriceAlarm = (props: PropsWithChildren<AiAlarmProps>) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button reset>
          {
            props.children
          }
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[900px]">
        <DialogHeader>
          <DialogTitle asChild>
            <div className="title text-center h-10" style={{}}>
              <DialogClose asChild>
                <span
                  className="bg-[#F36059] box-border rounded-full cursor-pointer  hover:opacity-90 absolute -z-0 w-4 h-4 left-2 top-3 flex items-center justify-center"
                  onKeyDown={() => { }}
                >
                  <Cross2Icon className="scale-75" />
                </span>
              </DialogClose>
              <span className="leading-[40px]">股价报警设置</span>
            </div>
          </DialogTitle>
          <VisuallyHidden>
            <DialogDescription />
          </VisuallyHidden>
        </DialogHeader>
        <div >
          <PriceAlarmForm code={props.code} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export {
  AiAlarmSetting,
  PriceAlarmSetting
}

export * from './ai-alarm-notice'