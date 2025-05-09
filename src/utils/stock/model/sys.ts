import { LatestValueBuffer } from './buff'
import { type SubscribeSysType, SubscribeTopic } from './type'
import type { SubscribeEvent } from '../subscribe/event'
import type { EventEmitter } from '@/utils/event'
import { get } from 'radash'

const sysActionResultParser = (data: any): SubscribeSysType => {
  const action = data.event as string

  return {
    action,
    event: data.event,
    status: data.status,
    subscribed: data.subscribed
  }
}

export class SysBuffer extends LatestValueBuffer<SubscribeSysType> {
  private _topic: SubscribeTopic.Sys
  private subscribed: any
  constructor(event: EventEmitter<SubscribeEvent>) {
    super(event)
    this._topic = SubscribeTopic.Sys
  }

  public get topic(): SubscribeTopic {
    return this._topic
  }

  public isEqual(data: any): boolean {
    return get(data, 'event') === this.topic
  }

  parser(data: any): void {
    if (!this.isEqual(data)) return

    const result = sysActionResultParser(data)

    this.addToBuffer({
      'sys': result
    })

    this.subscribed = result.subscribed
  }

  handleData(_data: Record<string, SubscribeSysType>): void {}
}
