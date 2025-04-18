import { uploadUtils } from '@/utils/oss'
import to from "await-to-js"
import type { Canceler } from 'axios'
import { nanoid } from 'nanoid'
import { type MediaMessageContent, MessageTask, TaskStatus } from 'wukongimjssdk'

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
      this.uploadFile(mediaContent.file, fileName)
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
    const [err, res] = await to(uploadUtils.upload(file, fileName))
    if(err){
      this.status === TaskStatus.fail
      this.update()
      console.log('文件上传失败！->', err)
      return
    }
    // const resp = await axios
    //   .post(uploadURL, param, {
    //     headers: { 'Content-Type': 'multipart/form-data' },
    //     cancelToken: new axios.CancelToken((c: Canceler) => {
    //       this.canceler = c
    //     }),
    //     onUploadProgress: e => {
    //       var completeProgress = (e.loaded / e.total) | 0
    //       this._progress = completeProgress
    //       this.update()
    //     }
    //   })
    //   .catch(error => {
    //     console.log('文件上传失败！->', error)
    //     this.status = TaskStatus.fail
    //     this.update()
    //   })
    if (res) {
      if (res.url) {
        const mediaContent = this.message.content as MediaMessageContent
        mediaContent.remoteUrl = res.url
        this.status = TaskStatus.success
        this.update()
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
