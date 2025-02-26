import type { getMallProducts } from "@/api"
import { Button, JknIcon } from "@/components"
import { cn } from "@/utils/style"
import Decimal from "decimal.js"



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

  const onBuy = (productId: string, price: string, name: string) => {
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
        {
          props.basic.map(b => (
            <div key={b.id} className="bg-background overflow-hidden w-[300px] text-center rounded-xl px-4 py-6 box-border space-y-2 relative">
              {
                b.is_hot === '1' ? (
                  <div className="absolute -right-10 text-sm box-border px-10 rotate-45 top-5 mx-auto bg-[#f44336]">
                    热卖推荐
                  </div>
                ) : null
              }
              <div className="text-lg font-bold">{b.name}</div>
              <div className="text-4xl py-2">
                ${b[props.type as keyof typeof b]}
                <span className="text-sm text-tertiary">/{unit}</span>
              </div>
              {
                props.type !== 'model_month' ? (
                  <span className="inline-block bg-accent text-sm px-2 py-0.5 rounded">节省 ${Decimal.create(+b.model_month * 12).minus(b[props.type as keyof typeof b] as string).toFixed(2)}</span>
                ) : null
              }
              <div className="px-4 pt-3">
                <Button block size="lg" onClick={() => onBuy(b.id, b[props.type as keyof typeof b] as string, b.name)}>点击购买</Button>
              </div>
              <div className="space-y-3 text-base !mt-8 pl-2">
                {
                  b.publicize.map((publicize, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    <div key={index} className="flex items-center space-x-2 text-xs">
                      <JknIcon.Checkbox className="w-3.5 h-3.5" checked={publicize[0] !== 0} checkedIcon="ic_have" uncheckedIcon="ic_delete" />
                      <span className={cn(publicize[0] === 0 && 'text-tertiary')}>{publicize[1]}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}