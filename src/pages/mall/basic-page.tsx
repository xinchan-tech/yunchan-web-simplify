import type { getMallProducts } from '@/api'
import {
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  JknIcon,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components'
import { useToast } from '@/hooks'
import { useConfig } from '@/store'
import { cn } from '@/utils/style'
import Decimal from 'decimal.js'

interface BasicPageProps {
  basic: Awaited<ReturnType<typeof getMallProducts>>['basic']
  type: string
  title: string
  onSubmit: (form: {
    productId: string
    name: string
    price: string
    model: string
    checked: boolean
  }) => void
}

export const BasicPage = (props: BasicPageProps) => {
  const unit = props.type === 'model_month' ? '月' : '年'
  const hasChinaIp = useConfig(s => s.ip === 'CN')
  const { toast } = useToast()

  const onBuy = (productId: string, price: string, name: string) => {
    const product = props.basic.find(b => b.id === productId)
    if (!product) {
      return
    }

    if (product.forbidden) {
      toast({
        description: product.forbidden
      })
      return
    }

    props.onSubmit({
      productId,
      name: `${props.title}-${name}`,
      price,
      model: props.type,
      checked: false
    })
  }

  return (
    <div>
      <div className="flex justify-between space-x-6">
        {props.basic.map(b => (
          <div
            key={b.id}
            className="bg-background overflow-hidden w-[300px] text-center rounded-xl px-4 py-6 box-border space-y-2 relative"
          >
            {b.is_hot === '1' ? (
              <div className="absolute -right-10 text-sm box-border px-10 rotate-45 top-5 mx-auto bg-[#f44336]">
                热卖推荐
              </div>
            ) : null}
            <div className="text-lg font-bold">{b.name}</div>
            <div className="text-4xl py-2">
              ${b[props.type as keyof typeof b]}
              <span className="text-sm text-tertiary">/{unit}</span>
            </div>
            {props.type !== 'model_month' ? (
              <span className="inline-block bg-accent text-sm px-2 py-0.5 rounded">
                节省 $
                {Decimal.create(+b.model_month * 12)
                  .minus(b[props.type as keyof typeof b] as string)
                  .toFixed(2)}
              </span>
            ) : null}
            <div className="px-4 pt-3">
              <Button block size="lg" onClick={() => onBuy(b.id, b[props.type as keyof typeof b] as string, b.name)}>
                点击购买
              </Button>
            </div>

            <div className="space-y-3 text-base !mt-8 pl-2">
              {!hasChinaIp && b.has_channel === 1 ? (
                <div className="flex items-center space-x-2 text-xs gradient-text ">
                  <JknIcon.Checkbox className="w-3.5 h-3.5" checked checkedIcon="ic_have" uncheckedIcon="ic_delete" />
                  <span>聊天社群</span>
                </div>
              ) : null}
              {b.publicize.map((publicize, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                <div key={index} className="flex items-center space-x-2 text-xs">
                  <JknIcon.Checkbox
                    className="w-3.5 h-3.5"
                    checked={publicize[0] !== 0}
                    checkedIcon="ic_have"
                    uncheckedIcon="ic_delete"
                  />
                  <span className="flex items-center">
                    <span className={cn(publicize[0] === 0 && 'text-tertiary')}>{publicize[1]}</span>
                    {index === 2 && publicize[2] ? (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <span>
                            &nbsp;
                            <JknIcon name="ic_tip1" className="w-3 h-3" />
                          </span>
                        </HoverCardTrigger>
                        <HoverCardContent className="p-0 w-[520px]">
                          <div className="flex ">
                            <div className="flex-1 border-0 border-r border-solid border-accent">
                              <div className="bg-accent">主图</div>
                              <div className="grid grid-cols-2 text-start gap-2 p-2">
                                {(publicize[2].main as string).split(',').map(s => (
                                  <span key={s}>{s}</span>
                                ))}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="bg-accent">副图</div>
                              <div className="grid grid-cols-2 text-start gap-2 p-2">
                                {(publicize[2].secondary as string).split(',').map(s => (
                                  <span key={s}>{s}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <style jsx>
        {`
          .gradient-text {
            background: linear-gradient(45deg, rgba(193, 148, 74), rgb(225, 27, 16));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        `}
      </style>
    </div>
  )
}
