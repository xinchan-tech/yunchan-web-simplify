import { cancelSubscription, getPaymentList } from '@/api'
import { Button, ScrollArea, SkeletonLoading } from '@/components'
import { useMutation, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router'

const Subscribe = () => {
  const bills = useQuery({
    queryKey: [getPaymentList.cacheKey],
    queryFn: getPaymentList
  })

  const calcExpireDay = (expireTime: string) => {
    const targetTime = dayjs(+expireTime * 1000)
    const nowTime = dayjs()

    const diff = targetTime.diff(nowTime, 'day')

    if (diff > 0) {
      return `剩余${diff}天`
    }

    return '已过期'
  }

  const navigate = useNavigate()

  const cancel = useMutation({
    mutationFn: (id: string) => {
      return cancelSubscription(id, 'product')
    },
    onSuccess: () => {
      bills.refetch()
    },
    onError: () => {}
  })

  const isValidPayment = (item: ArrayItem<NonNullable<typeof bills.data>['product']>) => {
    if (calcExpireDay(item.expire_time) === '已过期') {
      return false
    }

    if (item.subscribe_status === '3' || item.subscribe_status === '1') {
      return false
    }

    return true
  }

  return (
    <div className="h-full overflow-hidden flex flex-col text-white">
      <div className="text-xl border-0 border-b border-solid border-white cursor-pointer w-fit mb-10">订阅规则</div>
      {bills.isLoading ? (
        <SkeletonLoading count={12} />
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-5">
            {bills.data?.product.map(item => (
              <div key={item.id} className="border border-solid border-[#4A4A4A] rounded-[12px] box-border px-5 py-5">
                <div className="flex items-center w-[420px] box-border text-xl mb-2.5">
                  <span>
                    {item.name}({calcExpireDay(item.expire_time)})
                  </span>
                </div>
                <div className="text-[#808080] text-sm">
                  {' '}
                  到期时间: {dayjs(+item.expire_time * 1000).format('YYYY/MM/DD')}
                </div>
                {isValidPayment(item) ? (
                  <div className="mt-5 space-x-2.5">
                    {item.name !== '国王版' ? (
                      <Button
                        size="lg"
                        className="rounded-[6px] w-[96px] bg-white"
                        onClick={() => navigate('/app/mall')}
                      >
                        升级方案
                      </Button>
                    ) : null}

                    {item.subscribe_status !== '0' ? (
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-[42px] rounded-[6px] w-[96px]"
                        loading={cancel.isPending}
                        onClick={() => cancel.mutate(item.id)}
                      >
                        取消订阅
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

export default Subscribe
