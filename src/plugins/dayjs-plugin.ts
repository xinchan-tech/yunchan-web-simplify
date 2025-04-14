import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import relativeTime from 'dayjs/plugin/relativeTime'
import tz from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import weekday from 'dayjs/plugin/weekday'
import 'dayjs/locale/zh-cn'

// https://github.com/iamkun/dayjs/blob/dev/src/constant.js
const FORMAT_DEFAULT = '/[([^]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g'

// biome-ignore lint/complexity/useArrowFunction: <explanation>
const weekFormat = function (_: any, c: any) {
  const proto = c.prototype
  const oldFormat = proto.format

  proto.format = function (formatStr: string) {
    const locale = this.$locale() as any

    if (!this.isValid()) {
      return oldFormat.bind(this)(formatStr)
    }

    const str = formatStr || FORMAT_DEFAULT
    const result = str.replace(/\[([^\]]+)]|w|W|S/g, match => {
      switch (match) {
        case 'W':
          return locale.weekdays[this.day()]
        case 'w':
          return locale.weekdaysShort?.[this.day()]
        default:
          return match
      }
    })
    return oldFormat.bind(this)(result)
  }
}

declare module 'dayjs' {
  interface Dayjs {
    halfYearOfYear(): number
  }
}

const halfYearOfYear: dayjs.PluginFunc = (_option, _, dayjsProto) => {
  // @ts-ignore
  dayjsProto.halfYearOfYear = function () {
    // @ts-ignore
    return Math.floor(this.month() / 6) + 1
  }
}

dayjs.extend(utc)
dayjs.extend(utc)
dayjs.extend(tz)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(weekday)
dayjs.extend(weekFormat)
dayjs.extend(quarterOfYear)
dayjs.extend(halfYearOfYear)
dayjs.locale('zh-cn')
dayjs.extend(relativeTime)
