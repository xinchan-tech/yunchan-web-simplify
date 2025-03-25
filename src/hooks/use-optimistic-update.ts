import { queryClient } from '@/utils/query-client'
import { type FetchQueryOptions, useMutation } from '@tanstack/react-query'
import { produce } from 'immer'

type UseOptimisticUpdateOptions<P, T extends (params: P) => void> = {
  cacheKey: FetchQueryOptions['queryKey']
  onOptimisticUpdate: (params: P, data: any) => any
  action: T,
  onSuccess?: () => void
}

export const useOptimisticUpdate = <P = any, T extends (params: P) => void = (params: P) => void>(
  opts: UseOptimisticUpdateOptions<P, T>
) => {
  const action = useMutation({
    mutationFn: opts.action as any,
    onMutate: async (params: P) => {
      await queryClient.cancelQueries({ queryKey: opts.cacheKey })

      const previous = queryClient.getQueryData(opts.cacheKey)

      if (previous) {
        queryClient.setQueryData(
          opts.cacheKey,
          () =>  produce(previous, draft => {
            opts.onOptimisticUpdate(params, draft)
          })
        )
      }

      return { previous }
    },
    onError: (_, __, context) => {
      context?.previous && queryClient.setQueryData(opts.cacheKey, context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: opts.cacheKey })
    },
    onSuccess: opts.onSuccess
  })

  return action
}
