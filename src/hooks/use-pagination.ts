import { useCallback, useState } from "react"
import { useImmer } from 'use-immer'

type UsePaginationOpts = {
  page?: number
  pageSize?: number
}

export const usePagination = (opts?: UsePaginationOpts) => {
  const [pagination, setPagination] = useImmer({
    page: opts?.page || 1,
    pageSize: opts?.pageSize || 50
  })
  const [total, setTotal] = useState(0)


  const onPageChange = useCallback((page: number) => {
    setPagination(draft => {
      draft.page = page
    })
  }, [setPagination])

  const onPageSizeChange = useCallback((pageSize: number) => {
    setPagination(draft => {
      draft.pageSize = pageSize
      draft.page = 1
    })
  }, [setPagination])

  const onTotalChange = useCallback((total: number) => {
    setTotal(total)
  }, [])

  return {
    pagination,
    total,
    onPageChange,
    onPageSizeChange,
    onTotalChange
  }
}
