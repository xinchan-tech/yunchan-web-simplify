import { getVoteDetail, submitVote } from "@/api"
import { useMutation, useQuery } from "@tanstack/react-query"
import VoteTitleBg from '@/assets/icon/vote-title-bg.png'
import dayjs from "dayjs"
import { Button, JknAlert, JknIcon, ScrollArea, SkeletonLoading, StockView } from "@/components"
import { useState, type CSSProperties } from "react"

interface VoteDetailListProps {
  voteId: number
  onClose: () => void
}

export const VoteDetailList = (props: VoteDetailListProps) => {
  const detail = useQuery({
    queryKey: [getVoteDetail.cacheKey, props.voteId],
    queryFn: () => getVoteDetail(props.voteId.toString()),
    enabled: !!props.voteId,
    select: data => {
      data.items.sort((a, b) => b.count - a.count)
      return data
    }
  })

  const totalCount = detail.data?.items.reduce((acc, item) => acc + item.count, 0) || 0

  const canVote = (detail.data?.items.reduce((acc, item) => acc + (item.is_voted ? 1 : 0), 0) ?? 0) < (detail.data?.vote_limit ?? 0)

  const hasClose = detail.data?.status === 3

  const vote = useMutation({
    mutationFn: async (id: number) => {
      const item = detail.data?.items.find(i => i.id === id)
      if (!item) return

      await submitVote(props.voteId, [item])

      await detail.refetch()

      return
    },
    onSuccess: () => {
      
    },
    onError: (e) => {
      JknAlert.error(e.message)
    }
  })

  const [submitId, setSubmitId] = useState<number | null>(null)
  const _submitVote = (id: number) => {
    if(hasClose){
      JknAlert.error('投票已结束')
      return
    }
    if (!canVote) {
      JknAlert.error('您已达到最大投票数')
      return
    }
    if (vote.isPending) {
      JknAlert.error('请等待上一个投票完成')
      return
    }
    setSubmitId(id)
    vote.mutate(id)
  }

  const showDesc = () => {
    JknAlert.info({
      title: '投票说明',
      content: detail.data?.desc,
    })
  }

 

  return (
    <div className="w-[548px] rounded-lg overflow-hidden">
      <div className="h-[160px] p-5 box-content" style={{ background: `url(${VoteTitleBg}) no-repeat`, backgroundSize: '100%' }}>
        <JknIcon.Svg name="close" className="absolute right-4 top-4 cursor-pointer font-thin" size={28} onClick={props.onClose} />
        <div className="text-[40px] font-bold text-white mt-10" >
          {detail.data?.title}
        </div>
        <div className="text-secondary mt-2 flex items-center">
          <JknIcon name="clock-2" className="size-4" />&nbsp;
          到期时间: {
            hasClose ? (
              '已结束'
            ) : (
              detail.data?.end_time ? dayjs(detail.data.end_time * 1000).format('YYYY-MM-DD HH:mm') : ''
            )
          }
        </div>
        <div className="underline cursor-pointer mt-2 text-xl" onClick={showDesc} onKeyDown={() => { }}>
          投票说明
        </div>
      </div>
      <ScrollArea className="py-4 h-[680px] w-full bg-white">
        {
          detail.isLoading ? (
            <SkeletonLoading count={8} />
          ) : (
            detail.data?.items.map((item, index) => (
              <div key={item.id} className="flex items-center px-5 border-b border-border space-x-5 py-1.5 w-[548px] box-border overflow-hidden">
                <div>
                  {
                    index < 3 ? (
                      <JknIcon name={`vote-rank-${index + 1}` as any} className="size-8" />
                    ) : <div className="size-8 text-center">{index + 1}</div>
                  }
                </div>
                <div className="text-sm text-primary flex items-center text-[#575757] py-3.5 px-3 vote-progress flex-1 overflow-hidden box-border relative" style={{ '--vote-progress-width': `${(totalCount ? (item.count / totalCount) : 0) * 100}%` } as CSSProperties}>
                  <StockView code={item.title} showName />
                  <div className="ml-auto text-[#575757] mr-4">
                    {((totalCount ? (item.count / totalCount) : 0) * 100).toFixed(2)}%
                  </div>
                </div>
                {
                  !item.is_voted ? (
                    <Button loading={vote.isPending && submitId === item.id} className="text-sm bg-[#089981] rounded-[300px] text-white h-8 w-[68px] text-center" onClick={() => _submitVote(item.id)}>投票</Button>
                  ) : (
                    <Button className="text-sm  bg-[#939393] rounded-[300px] text-[#E7E7E7] h-8  w-[68px] text-center">已投票</Button>
                  )
                }
              </div>
            ))
          )
        }
      </ScrollArea>
      <style jsx>{`
        .vote-progress::after {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          background: rgba(217, 217, 217, 0.4);
          width: var(--vote-progress-width);
          border-radius: 10px;
        }

        .vote-progress :global(.stock-view-symbol) {
          color: #575757;
        }

        .vote-progress :global(.stock-view-name) {
          color: #808080;
        }
        `}</style>
    </div>
  )
}