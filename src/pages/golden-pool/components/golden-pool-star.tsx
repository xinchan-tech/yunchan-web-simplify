import { addStockCollectBatch, removeStockCollect } from '@/api'
import { getStockCollectCates } from '@/api'
import { JknAlert } from '@/components/jkn/jkn-alert'
import Star from '@/components/star'
import { usePropValue, useToast } from '@/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemoizedFn } from 'ahooks'
import { memo } from 'react'

interface GoldenPoolStarProps {
  /**
   * 股票金池分类 ID
   */
  cateId: number
  /**
   * 是否已收藏
   */
  checked: boolean
  /**
   * 股票代码
   */
  code: string
  /**
   * 状态更新回调
   */
  onUpdate?: (row: any) => void
}

/**
 * GoldenPoolStar 组件 - 单个股票收藏组件
 */
const _GoldenPoolStar = memo((props: GoldenPoolStarProps) => {
  const [checked, setChecked] = usePropValue(props.checked)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  /**
   * 添加收藏的 mutation
   * @param checked 是否收藏
   * @returns Promise
   */
  const addCollectMutation = useMutation({
    mutationFn: () => {
      return addStockCollectBatch({
        symbol: props.code,
        cate_ids: [1] // 默认使用 id 为 1 的金池
      })
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [getStockCollectCates.cacheKey, props.code] })
      setChecked(true)
      props.onUpdate?.({ symbol: props.code, collect: 1 })
    },
    onError: err => {
      setChecked(false)
      props.onUpdate?.({ symbol: props.code, collect: 0 })
      toast({
        description: '收藏失败：' + err.message
      })
    }
  })

  /**
   * 移除收藏的 mutation
   * @returns Promise
   */
  const removeCollectMutation = useMutation({
    mutationFn: () => {
      return removeStockCollect({
        symbols: [props.code],
        cate_ids: [props.cateId || 1]
      })
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [getStockCollectCates.cacheKey, props.code] })
      setChecked(false)
      props.onUpdate?.({ symbol: props.code, collect: 0 })
    },
    onError: err => {
      setChecked(true)
      props.onUpdate?.({ symbol: props.code, collect: 1 })
      toast({
        description: '取消收藏失败：' + err.message
      })
    }
  })

  /**
   * 处理星标点击事件
   * @param value 是否选中
   */
  const handleStarClick = useMemoizedFn((value: boolean) => {
    if (value) {
      // 收藏操作
      // addCollectMutation.mutate()
    } else {
      // 取消收藏操作，打开确认窗口
      JknAlert.confirm({
        content: '确认取消该股票收藏？',
        onAction: async action => {
          if (action === 'confirm') {
            removeCollectMutation.mutate()
          }
          return true
        }
      })
    }
  })

  return (
    <div className="flex justify-center items-center">
      <div onClick={() => handleStarClick(!checked)}>
        <Star checked={checked} />
      </div>
    </div>
  )
})

interface BatchStarProps {
  /**
   * 股票金池分类 ID
   */
  cateId: number
  /**
   * 是否已收藏
   */
  checked: boolean
  /**
   * 选中的股票代码列表
   */
  checkedChildren: string[]
  /**
   * 状态更新回调
   */
  onUpdate?: (checked: boolean) => void
}

/**
 * BatchStar 组件 - 批量收藏组件
 * 用于处理批量股票收藏操作
 */
const BatchStar = memo((props: BatchStarProps) => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  /**
   * 批量取消收藏的 mutation
   * 用于处理批量取消收藏操作
   * @returns Promise
   */
  const removeCollectMutation = useMutation({
    mutationFn: () => {
      return removeStockCollect({
        symbols: props.checkedChildren,
        cate_ids: [props.cateId]
      })
    },
    onMutate: async () => {
      // 取消可能正在进行的查询
      await queryClient.cancelQueries({ queryKey: [getStockCollectCates.cacheKey] })
      // 触发更新回调
      props.onUpdate?.(false)
    },
    onError: err => {
      // 显示错误提示
      toast({
        description: '批量取消收藏失败：' + err.message
      })
    }
  })

  /**
   * 处理星标点击事件
   * 根据当前状态执行不同的操作：
   * 1. 当前未收藏 -> 直接触发 onUpdate 事件，不做实际操作
   * 2. 当前已收藏 -> 显示确认弹窗，确认后取消收藏
   * @param value 是否选中
   */
  const handleStarClick = useMemoizedFn((value: boolean) => {
    if (value) {
      // 添加收藏操作，直接触发 onUpdate 事件，不做实际操作
      props.onUpdate?.(true)
    } else {
      // 取消收藏操作，打开确认窗口
      JknAlert.confirm({
        content: '确认取消选中股票的收藏？',
        onAction: async action => {
          if (action === 'confirm') {
            // 用户确认取消收藏，执行取消收藏操作
            removeCollectMutation.mutate()
            props.onUpdate?.(false)
          }
          return true
        }
      })
    }
  })

  return (
    <span className="inline-flex items-center cursor-pointer" onClick={() => handleStarClick(!props.checked)}>
      <Star checked={props.checked} />
    </span>
  )
})

const GoldenPoolStar = _GoldenPoolStar as typeof _GoldenPoolStar & {
  Batch: typeof BatchStar
}

GoldenPoolStar.Batch = BatchStar

export default GoldenPoolStar
