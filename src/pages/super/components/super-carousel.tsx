import * as React from 'react'
import { cn } from '@/utils/style'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon, ArrowRightIcon } from '@radix-ui/react-icons'
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react'
import Decimal from 'decimal.js'
import { SelectCheckIcon } from './super-icon'
import { JknIcon } from '@/components/jkn/jkn-icon'

/**
 * 经济数据项类型定义
 * @interface EconomicDataItem
 * @property {string} id - 数据项唯一标识
 * @property {string} name - 数据项名称
 * @property {number} amount - 成交额
 * @property {number} percent - 涨跌百分比
 */
export interface EconomicDataItem {
  id: string
  name: string
  amount: number
  percent: number
}

/**
 * 走马灯API类型
 */
type CarouselApi = UseEmblaCarouselType[1]

/**
 * 走马灯选项类型
 */
type CarouselOptions = Parameters<typeof useEmblaCarousel>[0]

/**
 * 走马灯插件类型
 */
type CarouselPlugin = Parameters<typeof useEmblaCarousel>[1]

/**
 * 经济数据走马灯属性
 * @interface SuperCarouselProps
 * @property {EconomicDataItem[]} items - 经济数据项列表
 * @property {CarouselOptions} opts - 走马灯选项
 * @property {CarouselPlugin} plugins - 走马灯插件
 * @property {(api: CarouselApi) => void} setApi - 设置走马灯API
 * @property {number} preloadPages - 预加载页数，默认为2
 * @property {() => void} onLoadMore - 加载更多数据的回调函数
 * @property {string[]} selectedIds - 已选中的数据项ID列表
 * @property {(ids: string[]) => void} onSelectionChange - 选中数据变化的回调函数
 */
interface SuperCarouselProps {
  items: EconomicDataItem[]
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  setApi?: (api: CarouselApi) => void
  preloadPages?: number
  onLoadMore?: () => void
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
}

/**
 * 走马灯上下文属性
 */
interface SuperCarouselContextProps extends Omit<SuperCarouselProps, 'items'> {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
  currentPage: number
  totalPages: number
  selectedIds: string[]
  toggleSelection: (id: string) => void
  isSelected: (id: string) => boolean
}

/**
 * 走马灯上下文
 */
const SuperCarouselContext = React.createContext<SuperCarouselContextProps | null>(null)

/**
 * 经济数据走马灯组件
 * @param props - 组件属性
 * @returns 经济数据走马灯组件
 */
export const SuperCarousel: React.FC<React.HTMLAttributes<HTMLDivElement> & SuperCarouselProps> = ({
  items,
  opts,
  setApi,
  plugins,
  preloadPages = 2,
  onLoadMore,
  selectedIds: externalSelectedIds,
  onSelectionChange,
  className,
  children,
  ...props
}) => {
  // 初始化走马灯
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: 'x',
      align: 'start',
      slidesToScroll: 4
    },
    plugins
  )

  // 状态管理
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)
  const [currentPage, setCurrentPage] = React.useState(0)
  const [totalPages, setTotalPages] = React.useState(0)

  // 内部选中状态管理
  const [internalSelectedIds, setInternalSelectedIds] = React.useState<string[]>(externalSelectedIds || [])

  // 使用外部或内部选中状态
  const selectedIds = externalSelectedIds || internalSelectedIds

  /**
   * 选择回调
   * @param api - 走马灯API
   */
  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return

    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
    setCurrentPage(api.selectedScrollSnap())
    setTotalPages(api.scrollSnapList().length)
  }, [])

  /**
   * 滚动到上一页
   */
  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev()
  }, [api])

  /**
   * 滚动到下一页
   */
  const scrollNext = React.useCallback(() => {
    api?.scrollNext()
  }, [api])

  /**
   * 切换选中状态
   * @param id - 数据项ID
   */
  const toggleSelection = React.useCallback(
    (id: string) => {
      const newSelectedIds = selectedIds.includes(id)
        ? selectedIds.filter(selectedId => selectedId !== id)
        : [...selectedIds, id]

      // 如果没有外部控制，则更新内部状态
      if (!externalSelectedIds) {
        setInternalSelectedIds(newSelectedIds)
      }

      // 通知外部选中状态变化
      onSelectionChange?.(newSelectedIds)
    },
    [selectedIds, externalSelectedIds, onSelectionChange]
  )

  /**
   * 检查是否选中
   * @param id - 数据项ID
   * @returns 是否选中
   */
  const isSelected = React.useCallback(
    (id: string) => {
      return selectedIds.includes(id)
    },
    [selectedIds]
  )

  // 设置API
  React.useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  // 监听走马灯事件
  React.useEffect(() => {
    if (!api) return

    onSelect(api)
    api.on('reInit', onSelect)
    api.on('select', onSelect)

    return () => {
      api?.off('select', onSelect)
    }
  }, [api, onSelect])

  // 添加鼠标滚轮事件处理
  React.useEffect(() => {
    if (!api || !carouselRef) return

    /**
     * 处理鼠标滚轮事件
     * @param e - 鼠标滚轮事件对象
     */
    const handleWheel = (e: Event) => {
      // 将事件转换为WheelEvent类型
      const wheelEvent = e as WheelEvent

      // 阻止默认滚动行为
      wheelEvent.preventDefault()

      // 根据滚轮方向决定滚动方向
      // deltaY > 0 表示向下滚动，对应走马灯向右滚动
      // deltaY < 0 表示向上滚动，对应走马灯向左滚动
      if (wheelEvent.deltaY > 0) {
        api.scrollNext()
      } else {
        api.scrollPrev()
      }
    }

    // 获取走马灯容器元素
    const containerElement = document.querySelector('[aria-roledescription="carousel"] .overflow-hidden')

    // 添加鼠标滚轮事件监听器
    if (containerElement) {
      containerElement.addEventListener('wheel', handleWheel, { passive: false })
    }

    // 清理函数，移除事件监听器
    return () => {
      if (containerElement) {
        containerElement.removeEventListener('wheel', handleWheel)
      }
    }
  }, [api, carouselRef])

  // 预加载逻辑
  React.useEffect(() => {
    if (!api || !onLoadMore) return

    // 当当前页面接近末尾时，触发加载更多数据的回调
    if (totalPages - currentPage <= preloadPages) {
      onLoadMore()
    }
  }, [api, currentPage, totalPages, preloadPages, onLoadMore])

  // 同步外部选中状态
  React.useEffect(() => {
    if (externalSelectedIds) {
      setInternalSelectedIds(externalSelectedIds)
    }
  }, [externalSelectedIds])

  return (
    <SuperCarouselContext.Provider
      value={{
        carouselRef,
        api,
        opts,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
        currentPage,
        totalPages,
        preloadPages,
        onLoadMore,
        selectedIds,
        toggleSelection,
        isSelected
      }}
    >
      <div className={cn('relative', className)} aria-roledescription="carousel" {...props}>
        <div ref={carouselRef} className="overflow-hidden">
          <div className="flex">
            {items.map(item => (
              <EconomicDataItem
                key={item.id}
                item={item}
                onCheckChange={() => toggleSelection(item.id)}
                isChecked={isSelected(item.id)}
              />
            ))}
          </div>
        </div>

        {canScrollPrev && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-[-19px] top-1/2 -translate-y-1/2 h-[38px] w-[38px] rounded-full bg-[#2E2E2E] hover:bg-[#2E2E2E]/70 z-10"
            onClick={scrollPrev}
          >
            <JknIcon.Svg name="arrow-left" className="h-4 w-4 text-white" />
            <span className="sr-only">上一页</span>
          </Button>
        )}

        {canScrollNext && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-[-19px] top-1/2 -translate-y-1/2 h-[38px] w-[38px] rounded-full bg-[#2E2E2E] hover:bg-[#2E2E2E]/70 z-10"
            onClick={scrollNext}
          >
            <JknIcon.Svg name="arrow-right" className="h-4 w-4 text-white" />
            <span className="sr-only">下一页</span>
          </Button>
        )}
      </div>
    </SuperCarouselContext.Provider>
  )
}

/**
 * 经济数据项组件属性
 */
interface EconomicDataItemProps {
  item: EconomicDataItem
  onCheckChange?: () => void
  isChecked?: boolean
}

/**
 * 经济数据项组件
 * @param props - 组件属性
 * @returns 经济数据项组件
 */
const EconomicDataItem: React.FC<EconomicDataItemProps> = ({ item, onCheckChange, isChecked = false }) => {
  // 阻止事件冒泡
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCheckChange?.()
  }

  // 使用正则表达式匹配数值部分（包括小数）
  const text = Decimal.create(item.amount).toShortCN(3)
  const numberMatch = text.match(/^\d+(\.\d+)?/)
  const numberPart = numberMatch ? numberMatch[0] : ''

  // 使用正则表达式匹配中文部分
  const chineseMatch = text.match(/[\u4e00-\u9fa5]+/)
  const chinesePart = chineseMatch ? chineseMatch[0] : ''

  return (
    <div className={cn('min-w-0 shrink-0 grow-0 basis-[230px] cursor-pointer transition-all duration-200 select-none')}>
      <div
        className={cn(
          'flex flex-col justify-between h-[100px] w-[220px] px-5 py-[10px] bg-[#1F1F1F] rounded-[10px] box-border border border-solid ',
          isChecked ? 'border-[#089981]' : 'border-[#B8B8B8B]'
        )}
        onClick={handleCheckboxClick}
      >
        <div className="flex flex-row items-center justify-between">
          <span className="text-base text-[#DBDBDB] truncate">{item.name}</span>
          <span className="w-4 h-4">{isChecked && <SelectCheckIcon color="#089981" />}</span>
        </div>

        <div className="flex flex-row items-center justify-between">
          <div>
            <div className="text-xs text-[#575757]">成交额</div>
            <div>
              <span className="text-base text-[#DBDBDB]">{numberPart}</span>
              <span className="ml-0.5 text-xs text-[#B8B8B8]">{chinesePart}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-xs text-[#575757]">涨跌幅</div>
            <div className="text-base" style={{ color: item.percent > 0 ? '#089981' : '#F23645' }}>
              {item.percent.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuperCarousel
