import FullScreenLoading from '@/components/loading'
import { cn } from '@/utils/style'
import { useThrottleFn } from 'ahooks'
import { useEffect, useRef, useState } from 'react'
import { animateScroll, scroller } from 'react-scroll'

export interface MsgScrollLoaderProps<T, P> {
  renderItem: (item: T) => React.ReactNode
  reverse?: boolean
  id?: string
  className?: string
  style?: React.CSSProperties
  onPageChange?: (page: number) => P
  fetchData: (params: P) => Promise<T[]>
  afterFetch?: (data: T[]) => T[]
  fetchParams: P
  rowKey: string
}

const MsgScrollLoader = <T, P extends Record<string, any>>(props: MsgScrollLoaderProps<T, P>): React.ReactNode => {
  const { renderItem, onPageChange, fetchData, fetchParams, rowKey } = props
  const scrollDomRef = useRef<HTMLDivElement>(null)
  const jumpOpioionId = useRef<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<T[]>([])
  const pageNumber = useRef(1)
  const pulldowning = useRef(false)
  const pulldownFinished = useRef(false)

  useEffect(() => {
    if (Object.keys(fetchParams).length > 0) {
      pullLatest(fetchParams)
    }
  }, [fetchParams])

  const pullLatest = async (params: P) => {
    try {
      const res = await fetchData(params)

      if (res.length > 0) {
        // 去重，只把老数据里不包含的opinion加进去
        let newPart = res.filter(item => {
          const transItem = item as T & { [rowKey: string]: string }
          return (
            messages.findIndex(old => {
              const transOld = old as T & { [rowKey: string]: string }
              return transItem[rowKey] === transOld[rowKey]
            }) < 0
          )
        })

        if (props.reverse === true) {
          newPart = newPart.reverse()
        }

        const newList = newPart.concat(messages)
        jumpOpioionId.current = ''

        setMessages(newList)
      }
    } catch (err) {}
  }

  const pullBeforeData = () => {
    if (pulldowning.current || pulldownFinished.current) {
      return
    }

    let params: P
    if (onPageChange) {
      params = onPageChange(pageNumber.current + 1)
      if (fetchData) {
        setLoading(true)
        pulldowning.current = true

        fetchData(params)
          .then(res => {
            pageNumber.current++
            if (res.length > 0) {
              let newPart = res
              if (props.reverse === true) {
                newPart = newPart.reverse()
              }
              const newMessages = newPart.concat(messages)
              const target = messages[0] as T & { [rowKey: string]: string }
              jumpOpioionId.current = target[rowKey]

              setMessages(newMessages)
            } else {
              pulldownFinished.current = true
            }
          })
          .finally(() => {
            setLoading(false)
            pulldowning.current = false
          })
      }
    }
  }

  const handleScroll = useThrottleFn(
    (e: any) => {
      const targetScrollTop = e?.target?.scrollTop
      if (targetScrollTop <= 30) {
        // 下拉
        pullBeforeData()
      }
    },
    { wait: 200 }
  )

  // 消息列表滚动到底部
  const scrollBottom = () => {
    animateScroll.scrollToBottom({
      containerId: props.id,
      duration: 0
    })
  }

  useEffect(() => {
    if (Array.isArray(messages) && messages.length > 0) {
      if (jumpOpioionId.current) {
        const targetID = jumpOpioionId.current
        const target = document.getElementById(targetID)

        if (target) {
          scroller.scrollTo(targetID, {
            containerId: props.id,
            duration: 0
          })
          jumpOpioionId.current = null
        }
      } else {
        scrollBottom()
      }
    }
  }, [messages])

  return (
    <div
      ref={scrollDomRef}
      onScroll={handleScroll.run}
      className={cn('scroll-content', props.className)}
      style={props.style}
      id={props.id}
    >
      {Array.isArray(messages) && messages.map(renderItem)}
      {loading && <FullScreenLoading fullScreen={false} />}
      <style jsx>{`
                {
                    .scroll-content {
                        overflow-y: auto;
                        padding: 0 12px;
                        height: 100%;
                        overflow-y: auto;

                        ::-webkit-scrollbar {
                        display: block;
                        width: 6px;
                        }

                        ::-webkit-scrollbar-thumb {
                        background-color: rgb(88, 88, 88);
                        }
                        scrollbar-thumb {
                        background-color: rgb(88, 88, 88);
                        }
                    }
                }
            `}</style>
    </div>
  )
}

export default MsgScrollLoader
