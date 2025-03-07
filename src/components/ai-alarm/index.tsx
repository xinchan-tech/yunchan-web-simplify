import { Cross2Icon } from '@radix-ui/react-icons'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useBoolean } from 'ahooks'
import { type PropsWithChildren, useEffect } from 'react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import AiAlarmForm from './ai-alarm-form'
import AiAlarmSetting from './ai-alarm-setting'
import PriceAlarmForm from './price-alarm-form'
import { PriceAlarmSetting } from './price-alarm-setting'
import { JknIcon } from "../jkn/jkn-icon"
import { cn } from "@/utils/style"

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
        {props.children}
      </div>
      {visible ? (
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
            <div>
              <AiAlarmForm code={props.code} />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  )
}

export const PriceAlarm = (props: PropsWithChildren<AiAlarmProps>) => {
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
      <div className="w-auto h-fit" onClick={setTrue} onKeyDown={() => { }}>
        {props.children}
      </div>
      {visible ? (
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
                  <span className="leading-[40px]">股价报警设置</span>
                </div>
              </DialogTitle>
              <VisuallyHidden>
                <DialogDescription />
              </VisuallyHidden>
            </DialogHeader>
            <div>
              <PriceAlarmForm code={props.code} />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  )
}

export const StockAlarm = (props: PropsWithChildren<AiAlarmProps>) => {
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
      <div className="w-auto h-fit" onClick={setTrue} onKeyDown={() => { }}>
        {props.children}
      </div>
      {visible ? (
        <Dialog open={open} onOpenChange={v => !v && setFalse()} modal={true}>
          <DialogContent className="w-[650px]">
            <DialogHeader>
              <DialogTitle asChild>
                <div className="px-4 flex items-center">
                  <div className="text-xl">
                    创建警报
                  </div>
                  <span
                    className={cn(
                      'box-border rounded cursor-pointer flex items-center justify-center ml-auto w-5 h-5 hover:bg-accent',
                    )}
                    onClick={setVisibleFalse}
                    onKeyDown={() => { }}
                  >
                    <JknIcon.Svg name="close" className="w-3 h-3" />
                  </span>
                </div>
              </DialogTitle>
              <VisuallyHidden>
                <DialogDescription />
              </VisuallyHidden>
            </DialogHeader>
            <div>
              <PriceAlarmForm code={props.code} />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  )
}


export { AiAlarmSetting, PriceAlarmSetting }

export * from './ai-alarm-notice'
