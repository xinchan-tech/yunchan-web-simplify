import type { Canceler } from 'axios'
import type { MediaMessageContent } from 'wukongimjssdk'
import { MessageTask, TaskStatus } from 'wukongimjssdk'
import UploadUtil from './uploadUtil'

export class MediaMessageUploadTask extends MessageTask {
  private _progress?: number
  private canceler: Canceler | undefined
  getUUID() {
    const len = 32 //32长度
    let radix = 16 //16进制
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
    const uuid = []
    let i
    radix = radix || chars.length
    if (len) {
      for (i = 0; i < len; i++) uuid[i] = chars[0 | (Math.random() * radix)]
    } else {
      let r
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-'
      uuid[14] = '4'
      for (i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | (Math.random() * 16)
          uuid[i] = chars[i === 19 ? (r & 0x3) | 0x8 : r]
        }
      }
    }
    return uuid.join('')
  }

  async start(): Promise<void> {
    const mediaContent = this.message.content as MediaMessageContent
    if (mediaContent.file) {
      // const fileName = mediaContent.file.name;
      let fileName = this.getUUID()
      let fileType = 'png'
      if (mediaContent.file.type) {
        fileType = mediaContent.file.type.split('/')[1]
      }
      fileName = `${fileName}.${fileType}`
      const resp = await UploadUtil.shared.uploadImg(mediaContent.file, fileName).catch(error => {
        console.log('文件上传失败！->', error)
        this.status = TaskStatus.fail
        this.update()
      })

      if (resp) {
        if (resp.url) {
          const mediaContent = this.message.content as MediaMessageContent
          mediaContent.remoteUrl = resp.url
          this.status = TaskStatus.success
          this.update()
        }
      }
    } else {
      console.log('多媒体消息不存在附件！')
      if (mediaContent.remoteUrl && mediaContent.remoteUrl !== '') {
        this.status = TaskStatus.success
        this.update()
      } else {
        this.status = TaskStatus.fail
        this.update()
      }
    }
  }

  suspend(): void {}
  resume(): void {}
  cancel(): void {
    this.status = TaskStatus.cancel
    if (this.canceler) {
      this.canceler()
    }
    this.update()
  }
  progress(): number {
    return this._progress ?? 0
  }
}
