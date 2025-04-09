import WKSDK, { Channel, ChannelTypePerson, type Message, ChannelInfo, ChannelTypeGroup } from 'wukongimjssdk'

import { getChatNameAndAvatar } from '@/api'
import { useGroupChatStoreNew } from '@/store/group-chat-new'
import dayjs from 'dayjs'
import { dateUtils } from '@/utils/date'

// 缓存单聊头像名称信息
export const setPersonChannelCache = (fromUID: string) => {
  return new Promise<{ avatar: string; name: string }>((resolve, reject) => {
    const params = {
      type: '1',
      id: fromUID
    }
    getChatNameAndAvatar(params).then(data => {
      if (data) {
        WKSDK.shared().channelManager.setChannleInfoForCache(userToChannelInfo(data, fromUID))
      }
      resolve(data)
    })
  })
}

export const groupToChannelInfo = (
  data: {
    name: string
    avatar: string
  },
  fromUID: string
): ChannelInfo => {
  const channelInfo = new ChannelInfo()
  channelInfo.channel = new Channel(fromUID, ChannelTypeGroup)
  channelInfo.title = data.name
  channelInfo.mute = false
  channelInfo.top = false
  channelInfo.online = false

  channelInfo.logo = data.avatar

  return channelInfo
}

export const userToChannelInfo = (
  data: {
    name: string
    avatar: string
  },
  fromUID: string
): ChannelInfo => {
  const channelInfo = new ChannelInfo()
  channelInfo.channel = new Channel(fromUID, ChannelTypePerson)
  channelInfo.title = data.name
  channelInfo.mute = false
  channelInfo.top = false
  channelInfo.online = false

  channelInfo.logo = data.avatar

  return channelInfo
}

export class MentionModel {
  all = false
  uids?: Array<string>
}

export const sortMessages = (messages: Message[]) => {
  const result = [...messages]
  for (let i = 0; i < result.length; i++) {
    const msg = result[i]
    if (msg.content.cmd === 'messageRevoke') {
      if (msg.content.param?.message_id) {
        const revokeMsgId: string = msg.content.param?.message_id

        // const temp = result.splice(i, 1);
        // 目标消息位置
        result.forEach((m, targetMessagePos) => {
          if (m.messageID === revokeMsgId) {
            // revoke标志,到时渲染成 xxx 撤回了一条消息

            if (result[targetMessagePos]) {
              result[targetMessagePos].remoteExtra.revoke = true
              result[targetMessagePos].remoteExtra.extra.revoker = msg.fromUID
              result[targetMessagePos].remoteExtra.extra.sender = m.fromUID
              result[targetMessagePos].remoteExtra.extra.originType = m.contentType
              result[targetMessagePos].remoteExtra.extra.originText = m.content.text
              // result.splice(targetMessagePos, 0, temp[0]);
            }
          }
        })
      }
    }
  }
  return result
}

// /**
//  * @deprecated
//  */
// const _formatDate = (date: Date, fmt: string) => {
//   const o: any = {
//     'M+': date.getMonth() + 1, //月份
//     'd+': date.getDate(), //日
//     'h+': date.getHours(), //小时
//     'm+': date.getMinutes(), //分
//     's+': date.getSeconds(), //秒
//     'q+': Math.floor((date.getMonth() + 3) / 3), //季度
//     S: date.getMilliseconds() //毫秒
//   }
//   if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, `${date.getFullYear()}`.substr(4 - RegExp.$1.length))
//   for (const k in o)
//     if (new RegExp(`(${k})`).test(fmt))
//       fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : `00${o[k]}`.substr(`${o[k]}`.length))
//   return fmt
// }

// /**
//  * @deprecated
//  */
// export function getTimeStringAutoShort2(timestamp: number, mustIncludeTime: boolean) {
// 当前时间
// const currentDate = new Date()
// // 目标判断时间
// const srcDate = new Date(timestamp)

// const currentYear = currentDate.getFullYear()
// const currentMonth = currentDate.getMonth() + 1
// const currentDateD = currentDate.getDate()

// const srcYear = srcDate.getFullYear()
// const srcMonth = srcDate.getMonth() + 1
// const srcDateD = srcDate.getDate()

// let ret = ''

// // 要额外显示的时间分钟
// const timeExtraStr = mustIncludeTime ? ` ${_formatDate(srcDate, 'hh:mm')}` : ''

// // 当年
// if (currentYear === srcYear) {
//   const currentTimestamp = currentDate.getTime()
//   const srcTimestamp = timestamp
//   // 相差时间（单位：毫秒）
//   const deltaTime = currentTimestamp - srcTimestamp

//   // 当天（月份和日期一致才是）
//   if (currentMonth === srcMonth && currentDateD === srcDateD) {
//     // 时间相差60秒以内
//     if (deltaTime < 60 * 1000) ret = '刚刚'
//     // 否则当天其它时间段的，直接显示“时:分”的形式
//     else ret = _formatDate(srcDate, 'hh:mm')
//   }
//   // 当年 && 当天之外的时间（即昨天及以前的时间）
//   else {
//     // 昨天（以“现在”的时候为基准-1天）
//     const yesterdayDate = new Date()
//     yesterdayDate.setDate(yesterdayDate.getDate() - 1)

//     // 前天（以“现在”的时候为基准-2天）
//     const beforeYesterdayDate = new Date()
//     beforeYesterdayDate.setDate(beforeYesterdayDate.getDate() - 2)

//     // 用目标日期的“月”和“天”跟上方计算出来的“昨天”进行比较，是最为准确的（如果用时间戳差值
//     // 的形式，是不准确的，比如：现在时刻是2019年02月22日1:00、而srcDate是2019年02月21日23:00，
//     // 这两者间只相差2小时，直接用“deltaTime/(3600 * 1000)” > 24小时来判断是否昨天，就完全是扯蛋的逻辑了）
//     if (srcMonth === yesterdayDate.getMonth() + 1 && srcDateD === yesterdayDate.getDate())
//       ret = '昨天' + timeExtraStr // -1d
//     // “前天”判断逻辑同上
//     else if (srcMonth === beforeYesterdayDate.getMonth() + 1 && srcDateD === beforeYesterdayDate.getDate())
//       ret = '前天' + timeExtraStr // -2d
//     else {
//       // 跟当前时间相差的小时数
//       const deltaHour = deltaTime / (3600 * 1000)

//       // // 如果小于或等 7*24小时就显示星期几
//       // if (deltaHour <= 7 * 24) {
//       //   let weekday = new Array(7);
//       //   weekday[0] = "星期日";
//       //   weekday[1] = "星期一";
//       //   weekday[2] = "星期二";
//       //   weekday[3] = "星期三";
//       //   weekday[4] = "星期四";
//       //   weekday[5] = "星期五";
//       //   weekday[6] = "星期六";

//       //   // 取出当前是星期几
//       //   let weedayDesc = weekday[srcDate.getDay()];
//       //   ret = weedayDesc + timeExtraStr;
//       // }
//       // // 否则直接显示完整日期时间
//       // else
//       ret = _formatDate(srcDate, 'yyyy/M/d') + timeExtraStr
//     }
//   }
// }
// // 往年
// else {
//   ret = _formatDate(srcDate, 'yyyy/M/d') + timeExtraStr
// }

// return ret
// }

export const getTimeFormatStr = (timestamp: number): string => {
  const timeFormat = useGroupChatStoreNew.getState().timeFormat
  let time = dayjs(timestamp)

  if (timeFormat.timezone === 'us') {
    time = dateUtils.toUsDay(time)
  }

  return timeFormat.format === 'ago' ? dateUtils.dateAgo(time) : time.format('YYYY-MM-DD HH:mm:ss')
}

export const genImgFileByUrl = (url: string, mime?: string) => {
  // return new Promise((resolve, reject) => {
  // const img = new Image();
  // img.src = url;

  // const canvas = document.createElement("canvas");
  // const context = canvas.getContext("2d");

  // img.onload = () => {
  //   try {
  //     canvas.height = img.height;
  //     canvas.width = img.width;
  //     context?.drawImage(img, 0, 0);
  //     const data = canvas.toDataURL(mime);
  //     const base64String = data.split(",")[1];
  //     console.log(`data:${mime || "image/png"};base64,${base64String}`, '`data:${mime || "image/png"};base64,${base64String}`')
  //     resolve(`data:${mime || "image/png"};base64,${base64String}`);
  //   } catch (er) {
  //     console.log(er);
  //     reject(er);
  //   }
  // };

  // });
  return fetch(url)
    .then(response => response.arrayBuffer())
    .then(buffer => {
      const base64String = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''))
      return `data:${mime || 'image/png'};base64,${base64String}`
    })
    .catch(err => {
      console.error(err)
    })
}

export const genBase64ToFile = (base64: string) => {
  const parts = base64.split(';base64,')
  const contentType = parts[0].split(':')[1]
  const raw = window.atob(parts[1])
  const rawLength = raw.length
  const uInt8Array = new Uint8Array(rawLength)
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i)
  }
  return new Blob([uInt8Array], { type: contentType })
}

type Task = () => void

export class MicroTaskQueue {
  private queue: Task[] = []
  private isProcessing = false

  enqueue(task: Task) {
    this.queue.push(task)
    // if (!this.isProcessing) {
    //   this.processQueue();
    // }
  }

  async processQueue() {
    this.isProcessing = true

    while (this.queue.length > 0) {
      const task = this.queue.shift()
      if (task) {
        await this.runTask(task)
      }
    }
    this.isProcessing = false
  }

  private runTask(task: Task) {
    return new Promise<void>(resolve => {
      task()
      resolve()
    })
  }
}

export const MacroTask = () => {
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      clearTimeout(timer)
      resolve('')
    }, 0)
  })
}

export const judgeIsUserInSyncChannelCache = (uid: string) => {
  const session = sessionStorage.getItem('syncUserChannelIds')
  let syncUserChannelIds: Record<string, boolean> = {}
  if (session) {
    syncUserChannelIds = JSON.parse(session) as Record<string, boolean>
  }
  if (syncUserChannelIds[uid] === true) {
    return true
  }
  return false
}

export const setUserInSyncChannelCache = (uid: string, payload: boolean) => {
  let syncUserChannelIds: Record<string, boolean> = {}
  const session = sessionStorage.getItem('syncUserChannelIds')
  if (session) {
    syncUserChannelIds = JSON.parse(session) as Record<string, boolean>
  }
  syncUserChannelIds[uid] = payload
  sessionStorage.setItem('syncUserChannelIds', JSON.stringify(syncUserChannelIds))
}

export const judgeIsExpireGroupCache = (uid: string) => {
  const session = sessionStorage.getItem('expireGroupIds')
  let expireGroupIds: Record<string, boolean> = {}
  if (session) {
    expireGroupIds = JSON.parse(session) as Record<string, boolean>
  }
  if (expireGroupIds[uid] === true) {
    return true
  }
  return false
}

export const setExpireGroupInCache = (uid: string, payload: boolean) => {
  let expireGroupIds: Record<string, boolean> = {}
  const session = sessionStorage.getItem('expireGroupIds')
  if (session) {
    expireGroupIds = JSON.parse(session) as Record<string, boolean>
  }
  expireGroupIds[uid] = payload
  sessionStorage.setItem('expireGroupIds', JSON.stringify(expireGroupIds))
}

// 判断退群消息
export const judgeIsExitNoticeMessage = (message: Message) => {
  const myId = WKSDK.shared().config.uid
  let result = false
  if (message?.content?.contentObj && message.content.contentObj.type === '2001') {
    if (message.content.contentObj.extra && message.content.contentObj.extra.uid === myId) {
      result = true
    }
  }

  return result
}

export const judgeHasReadGroupNotice = (groupId: string) => {
  let agreedGroupIds: Record<string, boolean> = {}
  const stroage = localStorage.getItem('agreedGroupIds')

  if (stroage) {
    agreedGroupIds = JSON.parse(stroage) as Record<string, boolean>
  }
  if (agreedGroupIds[groupId] === true) {
    return true
  }
  return false
}

export const setAgreedGroupInCache = (uid: string, payload: boolean) => {
  let agreedGroupIds: Record<string, boolean> = {}
  const stroage = localStorage.getItem('agreedGroupIds')
  if (stroage) {
    agreedGroupIds = JSON.parse(stroage) as Record<string, boolean>
  }
  agreedGroupIds[uid] = payload
  localStorage.setItem('agreedGroupIds', JSON.stringify(agreedGroupIds))
}
