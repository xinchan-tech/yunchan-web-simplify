import { cn } from '@/utils/style'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useBoolean } from 'ahooks'
import { type PropsWithChildren, useEffect } from 'react'
import { JknIcon } from '../tc/jkn-icon'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import PriceAlarmForm from './price-alarm-form'

interface AiAlarmProps {
  code?: string
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
      <div className="w-auto h-fit" onClick={setTrue} onKeyDown={() => {}}>
        {props.children}
      </div>
      {visible ? (
        <Dialog open={open} onOpenChange={v => !v && setFalse()} modal={true}>
          <DialogContent className="w-[600px] overflow-hidden" onOpenAutoFocus={e => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle asChild>
                <div className="px-4 flex items-center">
                  <div className="text-xl">创建警报</div>
                  <span
                    className={cn(
                      'box-border rounded cursor-pointer flex items-center justify-center ml-auto w-5 h-5 hover:bg-accent'
                    )}
                    onClick={setFalse}
                    onKeyDown={() => {}}
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
              <PriceAlarmForm code={props.code} onClose={() => setFalse()} />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  )
}

export * from './ai-alarm-notice'
