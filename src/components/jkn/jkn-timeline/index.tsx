import { JknIcon } from '@/components'
import { cn } from '@/utils/style'
import type React from 'react'
import { type ReactNode, useEffect, useRef } from 'react'

/**
 * JknTimeline组件属性接口
 * @interface JknTimelineProps
 * @property {string} [className] - 自定义样式类名
 * @property {JknTimelineItem[]} items - 时间轴项数组
 * @property {ReactNode | string} [dot] - 自定义时间轴点的节点或颜色，默认为圆点
 * @property {number} [dotFirstPaddingTop] - 第一个时间轴点的顶部内边距，默认为0px
 * @property {number} [tailWidth] - 轨迹线宽度，默认为1px
 * @property {number} [tailMarginRight] - 轨迹线右侧间距，默认为20px
 * @property {number} [itemPaddingBottom] - 时间轴项内容区域的底部内边距，默认为20px
 * @property {boolean} [loading] - 是否正在加载更多数据
 * @property {() => void} [onLoadMore] - 加载更多数据的回调函数
 * @property {number} [loadMoreThreshold] - 触发加载更多的阈值，默认为100px
 */
export interface JknTimelineProps {
  className?: string
  items: JknTimelineItem[]
  dot?: ReactNode | string
  dotFirstPaddingTop?: number
  tailWidth?: number
  tailMarginRight?: number
  itemPaddingBottom?: number
  loading?: boolean
  onLoadMore?: () => void
  loadMoreThreshold?: number
}

/**
 * 时间轴项接口
 * @interface JknTimelineItem
 * @property {ReactNode} content - 时间轴项的内容
 * @property {ReactNode | string} [dot] - 自定义时间轴点或颜色，会覆盖组件级别的dot
 *                                      - 当为ReactNode时，直接使用该节点作为轴点
 *                                      - 当为string时，使用该颜色创建默认样式的轴点
 * @property {string} [tailColor] - 该项的轨迹线颜色，默认为#575757
 */
export interface JknTimelineItem {
  content: ReactNode
  dot?: ReactNode | string
  tailColor?: string
}

/**
 * 默认时间轴点组件
 * @param {object} props - 组件属性
 * @param {string} [props.color] - 点的颜色，控制SVG中的颜色
 * @returns {ReactNode} 默认时间轴点
 */
const DefaultDot: React.FC<{ color?: string }> = ({ color = '#575757' }) => {
  return <JknIcon.Svg name="timeline-dot" size={14} color={color} />
}

/**
 * 自定义加载动画的样式
 */
const loadingAnimationStyle = `
  @keyframes jkn-timeline-loading-animation {
    0%, 80%, 100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }
`

/**
 * 加载中指示器组件
 * @param {object} props - 组件属性
 * @param {string} [props.color] - 加载指示器的颜色
 * @returns {ReactNode} 加载中指示器
 */
const LoadingIndicator: React.FC<{ color?: string }> = ({ color = '#575757' }) => {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: loadingAnimationStyle }} />
      <div className="flex items-center justify-center gap-1.5">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: color,
            animation: 'jkn-timeline-loading-animation 1.4s infinite ease-in-out both',
            animationDelay: '-0.32s'
          }}
        ></div>
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: color,
            animation: 'jkn-timeline-loading-animation 1.4s infinite ease-in-out both',
            animationDelay: '-0.16s'
          }}
        ></div>
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: color,
            animation: 'jkn-timeline-loading-animation 1.4s infinite ease-in-out both'
          }}
        ></div>
      </div>
    </>
  )
}

/**
 * 获取时间轴点
 * @param {ReactNode | string | undefined} dotProp - 点的属性
 * @param {string} defaultColor - 默认颜色
 * @returns {ReactNode} 时间轴点节点
 */
const getDot = (dotProp: ReactNode | string | undefined, defaultColor: string): ReactNode => {
  if (dotProp === undefined) {
    return <DefaultDot color={defaultColor} />
  }

  if (typeof dotProp === 'string') {
    return <DefaultDot color={dotProp} />
  }

  return dotProp
}

/**
 * JknTimeline组件
 * 垂直时间轴组件，用于展示按时间顺序排列的数据
 * @param {JknTimelineProps} props - 组件属性
 * @returns {ReactNode} JknTimeline组件
 */
export const JknTimeline: React.FC<JknTimelineProps> = ({
  className,
  items,
  dot,
  dotFirstPaddingTop = 0,
  tailWidth = 1,
  itemPaddingBottom = 20,
  loading = false,
  onLoadMore,
  loadMoreThreshold = 100,
  tailMarginRight = 20
}) => {
  // 引用时间轴容器元素
  const containerRef = useRef<HTMLDivElement>(null)
  // 引用时间轴内容元素
  const timelineRef = useRef<HTMLDivElement>(null)

  // 处理滚动事件，检测是否需要加载更多数据
  useEffect(() => {
    if (!onLoadMore) return

    const handleScroll = () => {
      if (!containerRef.current || loading) return

      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      const scrollBottom = scrollHeight - scrollTop - clientHeight

      // 当滚动到距离底部一定距离时，触发加载更多
      if (scrollBottom < loadMoreThreshold) {
        onLoadMore()
      }
    }

    const containerElement = containerRef.current
    if (containerElement) {
      containerElement.addEventListener('scroll', handleScroll)
    }

    return () => {
      if (containerElement) {
        containerElement.removeEventListener('scroll', handleScroll)
      }
    }
  }, [onLoadMore, loading, loadMoreThreshold])

  // 获取默认的点颜色
  const defaultTailColor = '#575757' // 默认轨迹线颜色
  const getDefaultDotColor = typeof dot === 'string' ? dot : defaultTailColor

  return (
    <div className={cn('h-full w-full overflow-y-auto overflow-x-hidden pb-5', className)} ref={containerRef}>
      <div className="flex flex-col w-full" ref={timelineRef}>
        {items.map((item, index) => {
          // 使用项级别的轨迹线颜色，如果未定义则使用默认颜色
          const itemTailColor = item.tailColor || defaultTailColor

          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            <div key={index} className="flex items-stretch">
              <div className="flex flex-col items-center" style={{ marginRight: `${tailMarginRight}px` }}>
                {/* 时间轴点 */}
                <div
                  className="flex items-center justify-center"
                  style={{
                    marginLeft: `${tailWidth / 2}px`,
                    paddingTop: `${index === 0 ? dotFirstPaddingTop : 0}px`
                  }}
                >
                  {getDot(item.dot, itemTailColor) || getDot(dot, getDefaultDotColor)}
                </div>

                {/* 时间轴轨迹线 - 使用flex-1自适应高度 */}
                <div
                  className="flex-1 w-0 pointer-events-none my-1"
                  style={{
                    borderLeft: `${tailWidth}px dashed ${itemTailColor}`
                  }}
                />
              </div>

              {/* 内容区域 */}
              <div
                className="flex-1 min-h-5"
                style={{
                  paddingBottom: `${itemPaddingBottom}px`
                }}
              >
                {item.content}
              </div>
            </div>
          )
        })}

        {/* 加载更多指示器 */}
        {loading && (
          <div className="flex justify-center py-5">
            <LoadingIndicator color={defaultTailColor} />
          </div>
        )}

        {/* 底部填充，确保内容可以完全滚动到视图中 */}
        <div className="h-[50px]" />
      </div>
    </div>
  )
}

// 添加默认导出
export default JknTimeline
