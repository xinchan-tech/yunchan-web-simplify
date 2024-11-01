import { getUsTime } from "@/api"
import { useTime } from "@/store"
import { dateToWeek } from "@/utils/date"
import { useRequest } from "ahooks"
import dayjs from "dayjs"
import { useState } from "react"

let timer: number | null = null
let localTimestamp = 0

const FooterTime = () => {
  const [usTime, setUsTime] = useState(0)
  const time = useTime()

  useRequest(getUsTime, {
    pollingInterval: 1000 * 60 * 1,
    onSuccess: (data) => {
      if (data.time) {
        if (timer) {
          clearTimeout(timer)
        }
        // data.time = 1730447995
        localTimestamp = new Date().valueOf()
        time.setUsTime(data.time * 1000)
        setUsTime(data.time * 1000)

        timer = setInterval(() => {
          const now = new Date().valueOf()
          setUsTime(data.time * 1000 + (now - localTimestamp))
          updateUsTimeToStore(data.time * 1000 + (now - localTimestamp))
        }, 1000)
      }
    }
  })

  // 优化render
  const updateUsTimeToStore = (newTime: number) => {
    const _newTime = dayjs(newTime).tz('America/New_York')
    const trading = time.getTrading()

    let r = ''

    if (_newTime.isAfter(_newTime.hour(4).minute(0).second(0)) && _newTime.isBefore(_newTime.hour(9).minute(30).second(0))) {
      r = 'preMarket'
    } else if (_newTime.isAfter(_newTime.hour(9).minute(30).second(0)) && _newTime.isBefore(_newTime.hour(16).minute(0).second(0))) {
      r = 'intraDay'
    } else {
      r = 'afterHours'
    }

    if (trading !== r) {
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