import { QueueBuffer } from './buff'
import type { SubscribeEvent } from "../subscribe/event"
import { type SubscribeSnapshotType, SubscribeTopic } from "./type"
import type { EventEmitter } from "@/utils/event"


const snapshotActionResultParser = (data: any): SubscribeSnapshotType => {
  const action = data.ev as string
  const {
    symbol,
    w52_high,
    w52_low,
    day_high,
    day_open,
    day_low,
    day_close,
    day_amount,
    day_volume,
    market_cap,
    turnover,
    pe,
    pb,
    pre_close,
    updated,
    ext_updated,
    day_updated,
    ext_price,
    bubble_val,
    bubble_status
  } = data.detail

  return {
    action,
    symbol,
    topic: action as string,
    data: {
      symbol,
      w52High: w52_high,
      w52Low: w52_low,
      dayHigh: day_high,
      dayOpen: day_open,
      dayLow: day_low,
      close: day_close,
      dayAmount: day_amount,
      dayVolume: day_volume,
      marketCap: market_cap,
      turnover,
      pe,
      pb,
      prevClose: pre_close,
      updated,
      extPrice: ext_price,
      extUpdated: ext_updated,
      dayUpdated: day_updated,
      bubbleVal: bubble_val,
      bubbleStatus: bubble_status
    }
  }
}

export class SnapshotBuffer extends QueueBuffer<SubscribeSnapshotType> {
  private _topic: SubscribeTopic.Snapshot
  constructor(event: EventEmitter<SubscribeEvent>){
    super(event)
    this._topic = SubscribeTopic.Snapshot
  }

  public get topic(): SubscribeTopic {
    return this._topic
  }

  parser(data: any): void {
    if(!this.isEqual(data)) return
    const result = snapshotActionResultParser(data)
    this.addToBuffer(result)
  }
  
  handleData(data: SubscribeSnapshotType): void {
    this.event.emit(this.topic as SubscribeTopic.Snapshot, data)
  }
}
