import type { SubscribeEvent } from '../subscribe/event'
import type { SubscribeTopic } from './type'
import { get } from 'radash'
import type { EventEmitter } from "@/utils/event"

export enum SubscribeBufferType {
  // 队列buff
  Queue = 1,
  // 最新值buff
  LatestValue = 2
}

export abstract class SubscribeBuffer<T = any> {
  abstract get buff(): T
  abstract get type(): SubscribeBufferType
  abstract get topic(): SubscribeTopic

  private _event: EventEmitter<SubscribeEvent>

  public get event(): EventEmitter<SubscribeEvent> {
    return this._event
  }

  constructor(event: EventEmitter<SubscribeEvent>) {
    this._event = event
  }

  public isEqual(data: any): boolean {
    return get(data, 'ev') === this.topic
  }

  abstract parser(data: any): void

  abstract clear(): void

  abstract handle(): void
}

export abstract class QueueBuffer<T> extends SubscribeBuffer<T[]> {
  protected _buff: T[] = []
  public get buff(): T[] {
    return this._buff
  }

  public get type(): SubscribeBufferType {
    return SubscribeBufferType.Queue
  }

  public clear(): void {
    this._buff = []
  }

  public get bufferHandleLength(): number {
    return 500
  }

  public get bufferMax(): number {
    return 20000
  }

  abstract handleData(data: T): void

  public handle(): void {
    const _handleBuff = this._buff.splice(0, this.bufferHandleLength)
    let count = this.bufferHandleLength
    while (_handleBuff.length > 0 && count > 0) {
      const data = _handleBuff.shift()
      count--
      this.handleData(data!)
    }
  }

  public addToBuffer(data: T): void {
    if (this._buff.length >= this.bufferMax) {
      this._buff.shift()
    }
    this._buff.push(data)
  }
}

export abstract class LatestValueBuffer<P, T extends object = Record<string, P>> extends SubscribeBuffer<T> {
  protected _buff: T = {} as T

  public get buff(): T {
    return this._buff
  }

  public get type(): SubscribeBufferType {
    return SubscribeBufferType.LatestValue
  }

  public clear(): void {
    this._buff = {} as T
  }
  abstract handleData(data: T): void

  public addToBuffer(data: T): void {
    Object.assign(this._buff, data)
  }

  public handle(): void {
    const tempBuffer = this.buff
    this.clear()

    this.handleData(tempBuffer)
  }
}

