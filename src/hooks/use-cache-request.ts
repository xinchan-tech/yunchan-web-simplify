import { useRequest } from "ahooks"

type UseCacheRequest = typeof useRequest

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const globalCache = new WeakMap<object, any>()

const useCacheRequest: UseCacheRequest = (...arg) => {

}