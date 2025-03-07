import { useSize } from 'ahooks'
import { type RefObject, useRef } from 'react'

export const useDomSize = <T extends HTMLElement>(): [ReturnType<typeof useSize>, RefObject<T>] => {
  const domRef = useRef<T>(null)
  const size = useSize(domRef)

  return [size, domRef]
}
