import { useUpdateEffect } from 'ahooks'
import { useRef } from 'react'

export const useLatestRef = <T>(value: T) => {
  const ref = useRef(value)

  useUpdateEffect(() => {
    ref.current = value
  }, [value])

  return ref
}
