import type { getMallProducts } from "@/api"
import { Button } from "@/components"
import Decimal from "decimal.js"



interface IncrementPageProps {
  increment: Awaited<ReturnType<typeof getMallProducts>>['increment']
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

export const IncrementPage = (props: IncrementPageProps) => {
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
          props.increment.map(b => (
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
            </div>
          ))
        }
      </div>
    </div>
  )
}