import { createEvent } from "@/utils/event"
import type { SubscribeBarType, SubscribeQuoteType, SubscribeRankType, SubscribeSnapshotType, SubscribeSysType, SubscribeTopic } from "../model/type"

export type SubscribeEvent = {
  [SubscribeTopic.Bar]: SubscribeBarType
  [SubscribeTopic.Quote]: Record<string, SubscribeQuoteType>
  [SubscribeTopic.QuoteTopic]: SubscribeQuoteType
  [SubscribeTopic.Snapshot]: SubscribeSnapshotType
  [SubscribeTopic.Rank]: SubscribeRankType
  [SubscribeTopic.Sys]: SubscribeSysType
}

export const subscribeEvent = createEvent<SubscribeEvent>()