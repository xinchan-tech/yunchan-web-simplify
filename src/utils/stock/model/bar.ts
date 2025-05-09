import type { StockRawRecord } from '@/api'
import { QueueBuffer } from './buff'
import type { SubscribeEvent } from "../subscribe/event"
import { type SubscribeBarType, SubscribeTopic } from "./type"
import type { EventEmitter } from "@/utils/event"


const barActionResultParser = (data: any): SubscribeBarType => {
  const action = data.ev as string
  const [topic, ...raws] = data.b.split(',')
  const rawRecord = raws.map((raw: string, index: number) =>
    index === 0 ? raw : Number.parseFloat(raw as string)
  ) as StockRawRecord

  /**
   * 新版是开高低收
   * 旧版是开收高低
   */
  rawRecord[2] = raws[4]
  rawRecord[3] = raws[2]
  rawRecord[4] = raws[3]

  return {
    action,
    topic: topic as string,
    symbol: topic,
    rawRecord,
    extra: data.d as string
  }
}

export class BarBuffer extends QueueBuffer<SubscribeBarType> {
  private _topic: SubscribeTopic.Bar
  constructor(event: EventEmitter<SubscribeEvent>){
    super(event)
    this._topic = SubscribeTopic.Bar
  }

  public get topic(): SubscribeTopic {
    return this._topic
  }

  parser(data: any): SubscribeBarType[] {
    if(!this.isEqual(data)) {
      return []
    }
    const result = barActionResultParser(data)
    this.addToBuffer(result)
    return [result]
  }
  
  handleData(data: SubscribeBarType): void {
    this.event.emit(this.topic as SubscribeTopic.Bar, data)
  }
}
