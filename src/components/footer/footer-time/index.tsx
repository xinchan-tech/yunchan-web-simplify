import { getUsTime } from "@/api"
import { useTime } from "@/store"
import { useRequest } from "ahooks"
import dayjs from "dayjs"
import { useEffect, useRef, useState } from "react"
import { JknIcon } from "../../jkn/jkn-icon"
import { stockUtils } from "@/utils/stock"

const FooterTime = () => {
  const [localUsTime, setLocalUsTime] = useState(0)
  const setLocalStamp = useTime(s => s.setLocalStamp)
  const setUsTime = useTime(s => s.setUsTime)
  const getTrading = useTime(s => s.getTrading)
  const usTime = useTime(s => s.usTime)
  const localStamp = useTime(s => s.localStamp)
  const timer = useRef<number | null>(null)
  const timeForOnline = useRef<number>(usTime)
  const timeForLocal = useRef<number>(localStamp)


  useRequest(getUsTime, {
    pollingInterval: 1000 * 60 * 5,
    onSuccess: (data) => {
      const local = new Date().valueOf()
      setLocalStamp(local)

      const uTime = data.time * 1000
      setUsTime(uTime)
      timeForOnline.current = uTime
      timeForLocal.current = local
    }
  })

  useEffect(() => {
    updateUsTimeToStore(updateTimeStamp())

    return () => {
      cancelAnimationFrame(timer.current as number)
    }
  }, [])

  const updateTimeStamp = (): number => {
    const currentTimestamp = new Date().valueOf()
    const diffTime = (currentTimestamp - timeForLocal.current)
    setLocalUsTime(timeForOnline.current + diffTime)
    return timeForOnline.current + diffTime
  }

  // 优化render
  const updateUsTimeToStore = (newTime: number) => {
    const trading = getTrading()
    const localTrading = stockUtils.getTrading(dayjs(newTime).tz('America/New_York').valueOf())
 
    if (trading !== localTrading) {
      setUsTime(newTime)
      setLocalStamp(new Date().valueOf())
    }

    timer.current = requestAnimationFrame(() => {
      updateUsTimeToStore(updateTimeStamp())
    })
  }

  return (
    <div>
      {
        localUsTime && (
          <span className="flex items-center">
            <JknIcon name="ic_us" className="w-3 h-3" /> &nbsp;
            美东时间：
            {
              dayjs(localUsTime).tz('America/New_York').format('MM-DD  W  HH:mm:ss')
            }
          </span>
        )
      }
    </div>
  )
}

export default FooterTime