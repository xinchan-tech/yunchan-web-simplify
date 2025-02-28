import { getGroupChannels } from '@/api'
import { Button, JknAvatar, JknIcon } from '@/components'
import { useToast } from "@/hooks"
import { colorUtil } from '@/utils/style'
import { useQuery } from '@tanstack/react-query'

interface GroupPageProps {
  title: string
  type: string
  onSubmit: (form: {
    productId: string
    name: string
    price: string
    model: string
    checked: boolean
    productType: string
  }) => void
}

export const GroupPage = (props: GroupPageProps) => {
  const params = {
    type: '1',
    limit: 100
  }
  const channels = useQuery({
    queryKey: [getGroupChannels.cacheKey, params],
    queryFn: () => getGroupChannels(params as any)
  })

  const getPrice = (id: string) => {
    const products = channels.data?.find(channel => channel.id === id)?.products

    if (!products) {
      return ''
    }

    if (props.type === 'model_month') {
      return products.find(product => product.type === 'month')?.price
    }

    if (props.type === 'model_year') {
      return products.find(product => product.type === 'year')?.price
    }

    return ''
  }

  const unit = props.type === 'model_month' ? '月' : props.type === 'model_year' ? '年' : '-'

  const onSubmit = async (channelId: string, name: string, account: string) => {
    props.onSubmit({
      productId: account,
      name: `${props.title}-${name}`,
      price: getPrice(channelId) ?? '0',
      model: props.type,
      checked: false,
      productType: 'group'
    })
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {channels.data?.map(channel => (
          <div key={channel.id} className="bg-background rounded-xl p-4 flex items-center w-[500px]">
            <div>
              {channel.avatar ? (
                <JknAvatar className="w-16 h-16" src={channel.avatar} />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                  style={{ background: colorUtil.radomColorForPalette() }}
                >
                  {channel.name[0]}
                </div>
              )}
            </div>
            <div className="mx-4 w-full overflow-hidden">
              <div className="">
                {channel.name}
                <span className="bg-accent text-xs inline-flex items-center px-1.5 py-[1px] rounded text-tertiary ml-2">
                  <JknIcon className="w-3 h-3 mr-0.5" name="ic_person" />
                  {channel.total_user}
                </span>
              </div>
              <div className="mt-1 space-x-2">
                {channel.tags
                  .split(',')
                  .filter(s => s)
                  .map(tag => (
                    <span
                      key={tag}
                      className="text-xs bg-accent inline-block px-2 py-[1px] rounded-sm text-secondary max-w-20 overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
              <div className="overflow-hidden w-full">
                {channel.brief ? (
                  <div className="text-xs text-tertiary overflow-hidden text-ellipsis whitespace-nowrap w-full ">
                    社群简介：{channel.brief}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="!ml-auto text-right">
              <div>
                <span className="text-lg font-bold">
                  ${getPrice(channel.id)}&nbsp;<span className="text-xs font-normal text-tertiary">/{unit}</span>
                </span>
                {+channel.in_channel ? (
                  <div className="w-20 bg-[#232323] text-xs leading-[28px] text-center text-tertiary rounded mt-0.5">
                    已加入
                  </div>
                ) : (
                  <Button
                    className="w-20 !leading-[28px] h-[28px]"
                    size="mini"
                    onClick={() => onSubmit(channel.id, channel.name, channel.account)}
                  >
                    加入
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
