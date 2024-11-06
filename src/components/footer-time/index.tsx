import { getUsTime } from "@/api"
import { useTime } from "@/store"
import { dateToWeek, getTrading } from "@/utils/date"
import { useMount, useRequest, useUnmount } from "ahooks"
import dayjs from "dayjs"
import { useRef, useState } from "react"

const FooterTime = () => {
  const [usTime, setUsTime] = useState(0)
  const time = useTime()
  const timer = useRef<number | null>(null)
  const timeForOnline = useRef<number>(time.usTime)
  const timeForLocal = useRef<number>(time.localStamp)


  useRequest(getUsTime, {
    pollingInterval: 1000 * 10,
    onSuccess: (data) => {
      // const local = new Date().valueOf()
      // time.setLocalStamp(local)
      // const uTime = data.time * 1000
      // time.setUsTime(uTime)
      // timeForOnline.current = uTime
      // timeForLocal.current = local
    }
  })

  useMount(() => {
    // data.time = 1730447995
    updateUsTimeToStore(updateTimeStamp())
    timer.current = setInterval(() => {
      updateUsTimeToStore(updateTimeStamp())
    }, 1000)
  })

  useUnmount(() => {
    timer.current && clearInterval(timer.current)
  })

  const updateTimeStamp = (): number => {
    const currentTimestamp = new Date().valueOf()
    const diffTime = (currentTimestamp - timeForLocal.current)
    setUsTime(timeForOnline.current + diffTime)
    return timeForOnline.current + diffTime
  }

  // 优化render
  const updateUsTimeToStore = (newTime: number) => {
    const trading = time.getTrading()
    const localTrading = getTrading(dayjs(newTime).tz('America/New_York').format('YYYY-MM-DD HH:mm:ss'))
    if (trading !== localTrading) {
      time.setUsTime(newTime)
    }
  }

  return (
    <div>
      {
        usTime && (
          <span>
            {dayjs(usTime).tz('America/New_York').format('MM-DD')}
            {dateToWeek(dayjs(usTime).tz('America/New_York'))}
            {dayjs(usTime).tz('America/New_York').format('HH:mm:ss')}
          </span>
        )
      }
    </div>
  )
}

export default FooterTime