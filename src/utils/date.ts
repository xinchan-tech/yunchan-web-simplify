import { useConfig } from '@/store'
import dayjs, { type Dayjs } from 'dayjs'

export const dateToWeek = (date: Dayjs | string) => {
  const language = useConfig.getState().language
  const weeks =
    language === 'zh_CN'
      ? ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (dayjs.isDayjs(date)) {
    return weeks[date.day()]
  }
  return weeks[dayjs(date).day()]
}
