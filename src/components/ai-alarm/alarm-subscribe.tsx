import { AlarmType } from '@/api'
import { useConfig, useToken } from '@/store'
import { dateUtils } from '@/utils/date'
import { stockUtils } from '@/utils/stock'
import { type WsSubscribeType, WsV2 } from '@/utils/ws'
import { memo, useEffect } from 'react'
import { toast } from 'sonner'
import { JknIcon, Sonner, Star } from '..'
import { appEvent } from "@/utils/event"
import NoticeMp3 from '@/assets/notice/alarm_notice.mp3'

let noticeCache: HTMLAudioElement | null = null

export const AlarmSubscribe = memo(() => {
  const token = useToken(s => s.token)

  useEffect(() => {
    if (token) {
      const ws = WsV2.create(token)

      const unSubscribe = ws.onAlarm(e => {
        appEvent.emit('alarm', e)
        if(!noticeCache){
          noticeCache = new Audio(NoticeMp3)
        }

        noticeCache?.play()
        const n = toast(
          <AlarmContent
            data={e}
            onClose={() => {
              toast.dismiss(n)
            }}
          />,
          {
            duration: 10 * 1000
          }
        )
      })

      return () => {
        unSubscribe()
      }
    }
  }, [token])

  return (
    <div>
      <Sonner />
    </div>
  )
})

interface AlarmContentProps {
  data: WsSubscribeType['alarm']
  onClose: () => void
}

const AlarmContent = ({ data, onClose }: AlarmContentProps) => {
  const onClick = () => {
    stockUtils.gotoStockPage(data.symbol, {
      interval: data.stock_cycle ?? 0
    })
  }

  return (
    <div className="flex leading-none font-normal w-full cursor-pointer" onClick={() => onClick()} onKeyDown={() => {}}>
      <div className="h-[110px] w-[60px] rounded-l-[8px] bg-[#4DD0E133] flex flex-shrink-0">
        <JknIcon.Svg name="alarm-2" size={20} className="m-auto text-[#4DD0E1]" />
      </div>
      <div className="px-2.5 py-2.5 w-[360px] space-y-1">
        <div className="flex items-center w-full">
          <span className="text-base font-bold mr-2">警报</span>
          <JknIcon.Stock symbol={data.symbol} className="size-4 ml-2 mr-1" />
          <span className="text-sm">{data.symbol}</span>
          <JknIcon.Svg
            name="close"
            size={12}
            hoverable
            onClick={e => {
              e.stopPropagation()
              onClose()
            }}
            className="ml-auto p-2"
          />
        </div>
        <div className="flex items-center text-sm space-x-2">
          {data.type === AlarmType.AI ? (
            <>
              <span>{stockUtils.intervalToStr(data.stock_cycle)}</span>
              <span data-direction={data.bull === '1' ? 'up' : 'down'} className="ml-1">
                {data.indicators}
                <span>{data.bull === '1' ? '↑' : '↓'}</span>
                {data.hdly ? <span> · {data.hdly}</span> : null}
              </span>
              <span className="bg-accent py-0.5 rounded text-xs px-1">AI</span>
            </>
          ) : null}

          {data.type === AlarmType.PRICE ? (
            <>
              <span data-direction={data.bull === '1' ? 'up' : 'down'}>
                {data.indicators}
                <span>{data.bull === '1' ? '↑' : '↓'}</span>
              </span>
              <span className="bg-accent py-0.5 rounded text-xs px-1">股价</span>
            </>
          ) : null}

          {data.type === AlarmType.PERCENT ? (
            <>
              <span data-direction={data.pnl_percent > 0 ? 'up' : 'down'}>
                <span>止损触发价</span>
                {data.base_price}
                <span>{data.pnl_percent > 0 ? '↑' : '↓'}</span>&nbsp;
                <span className="text-foreground">
                  {data.trigger_type === 1
                    ? `盈亏比例${(data.pnl_percent * 100).toFixed(2)}%`
                    : `盈亏金额${data.pnl_price}`}
                </span>
              </span>
              <span className="bg-accent py-0.5 rounded text-xs px-1">浮动</span>
            </>
          ) : null}
        </div>
        {data.type === AlarmType.AI ? (
          <Star.Rect
            total={5}
            count={data.score_total}
            className="ml-0.5 w-1.5 h-2.5"
            activeColor={
              data.bull === '1'
                ? useConfig.getState().getStockColor(true, 'hex')
                : useConfig.getState().getStockColor(false, 'hex')
            }
          />
        ) : (
          <span className="h-2.5">&nbsp;</span>
        )}
        <div className="text-right">
          <span className="text-xs text-tertiary">{dateUtils.toUsDay(data.alarm_time).format('HH:mm:ss')}</span>
        </div>
      </div>
    </div>
  )
}
