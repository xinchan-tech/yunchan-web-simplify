import { appEvent } from "@/utils/event"
import { uploadUtils } from '@/utils/oss'
import to from "await-to-js"
import type { Canceler } from 'axios'
import BigNumber from "bignumber.js"
import { nanoid } from 'nanoid'
import WKSDK, { type MediaMessageContent, MessageTask, SendackPacket, TaskStatus } from 'wukongimjssdk'
import { chatEvent } from "./event"

export class MediaMessageUploadTask extends MessageTask {
  private _progress?: number
  private canceler: Canceler | undefined
  getUUID() {
    return nanoid(32)
  }

  async start(): Promise<void> {
    const mediaContent = this.message.content as MediaMessageContent
    if (mediaContent.file) {
      const fileName = `${this.getUUID()}`
      this.uploadFile(mediaContent.file, fileName).catch(e => {
        console.error(e)
        this.cancel()
        const pack = new SendackPacket()
        pack.clientSeq = this.message.clientSeq
        pack.reasonCode = 0
        pack.messageID = new BigNumber(this.message.messageID)

        setTimeout(() => {
          WKSDK.shared().chatManager.notifyMessageStatusListeners(pack)
        }, 1000)
      })

   
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

  async uploadFile(file: File, fileName: string) {
    const res = await uploadUtils.upload(file, fileName)
    if (res) {
      if (res.url) {
        const mediaContent = this.message.content as MediaMessageContent
        mediaContent.remoteUrl = res.url
        this.status = TaskStatus.success
        this.update()
        chatEvent.emit('imageUploadSuccess', {
          clientSeq: this.message.clientSeq,
          url: res.url
        })
        return TaskStatus.success
      }
    }
  }

  // 获取上传路径
  getUploadURL(path: string): string {
    return ''
  }

  // 请求暂停
  suspend(): void {}
  // 请求恢复
  resume(): void {}
  // 请求取消
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
