import { useCallback, useMemo, useState } from 'react'
import { useLatestRef } from './use-latest-ref'

// 栈
export const useStack = <T>(init?: T[]) => {
  const [stack, setStack] = useState<T[]>(init || [])
  const stackLast = useLatestRef(stack)

  // 入栈
  const push = useCallback((item: T) => {
    setStack(prevStack => [...prevStack, item])
  }, [])

  // 出栈
  const pop = useCallback(() => {
    setStack(prevStack => {
      const newStack = [...prevStack]
      newStack.pop()
      return newStack
    })
  }, [])

  const clear = useCallback(() => {
    setStack([])
  }, [])

  const peek = useCallback((): Nullable<T> => {
    return stack[stack.length - 1]
  }, [stack])

  const last = useCallback((): Nullable<T> => {
    return stackLast.current[stackLast.current.length - 1]
  }, [stackLast])

  const size = useMemo(() => stack.length, [stack])

  const isEmpty = useMemo(() => stack.length === 0, [stack])

  const getStack = useCallback(() => stack, [stack])

  return { push, pop, size, isEmpty, clear, peek, getStack, last } as const
}
