import { checkMallProductOrderStatus, createMallProductOrder, getMallProducts, getPaymentTypes } from '@/api'
import {
  Button,
  JknIcon,
  Label,
  RadioGroup,
  RadioGroupItem,
  Skeleton,
  ToggleGroup,
  ToggleGroupItem,
  useFormModal
} from '@/components'
import { useToast, useZForm } from '@/hooks'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'
import { BasicPage } from './basic-page'
import { GroupPage } from './group-page'
import { IntroPage } from './intro-page'
import { useFormContext } from 'react-hook-form'
import { cn } from '@/utils/style'
import { useBoolean, useMount } from 'ahooks'
import to from 'await-to-js'
import qs from "qs"
import { IncrementPage } from "./increment-page"

const subscribeTypes = [
  { name: '按年订阅', type: 'model_year' },
  { name: '按月订阅', type: 'model_month' }
]

const versions = [
  { name: '旗舰达人', value: 'basic' },
  { name: '量化精英', value: 'plus' },
  { name: '聊天社群', value: 'group' },
  { name: '增值包', value: 'increment' }
]

type Version = 'basic' | 'plus' | 'group' | 'increment'

const productForm = z.object({
  productId: z.string(),
  name: z.string(),
  price: z.string(),
  model: z.string()
})

const MallPage = () => {
  const products = useQuery({
    queryKey: [getMallProducts.cacheKey],
    queryFn: getMallProducts
  })

  const [version, setVersion] = useState<Version>('basic')
  const [subscribeType, setSubscribeType] = useState<string>('model_year')
  const form = useZForm(productForm, {
    productId: '',
    name: '',
    price: '',
    model: ''
  })

  const queryClient = useQueryClient()
  useMount(() => {
    queryClient.prefetchQuery({
      queryKey: [getPaymentTypes.cacheKey],
      queryFn: getPaymentTypes
    })
  })

  const cashier = useFormModal({
    form,
    title: '购买商品',
    content: <CashierPage />,
    closeIcon: true,
    closeOnMaskClick: false,
    footer: null,
    onOpen: (values: z.infer<typeof productForm>) => {
      Object.entries(values).forEach(([key, value]) => {
        form.setValue(key as any, value)
      })
    },
    onOk: async () => { }
  })

  useMount(() => {
    const query = qs.parse(window.location.search, { ignoreQueryPrefix: true })
    if (query.code) {
      const current = new Date().getTime()
      const codeObj = {
        code: query.code,
        cid: query.cid,
        timestamp: current
      }

      localStorage.setItem('invite-code', JSON.stringify(codeObj))
    }
  })

  return (
    <div className="flex flex-col items-center h-full overflow-auto w-full pb-10 box-border">
      <ToggleGroup
        type="single"
        variant="outline"
        value={version}
        onValueChange={(v: typeof version) => setVersion(v)}
        className="my-12 gap-0"
      >
        {versions.map((v, index) => (
          <ToggleGroupItem
            key={v.value}
            className={cn(
              'w-32 rounded-none',
              index === 0 && 'rounded-l-3xl',
              index === versions.length - 1 && 'rounded-r-3xl'
            )}
            value={v.value}
            title={v.name}
          >
            {v.name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="text-center text-4xl font-bold">美股会员服务-投资的方案</div>
      <div className="my-8">
        <RadioGroup className="flex space-x-8" value={subscribeType} onValueChange={value => setSubscribeType(value)}>
          {subscribeTypes.map(st => (
            <div className="flex items-center space-x-2" key={st.type}>
              <RadioGroupItem
                value={st.type}
                id={`mall-product-${st.type}`}
                style={{ '--foreground': 'var(--primary)' } as CSSProperties}
              />
              <Label htmlFor={`mall-product-${st.type}`}>{st.name}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <div>
        {{
          basic: (
            <BasicPage
              title="旗舰达人"
              basic={products.data?.basic ?? []}
              type={subscribeType}
              onSubmit={v => cashier.open(v)}
            />
          ),
          plus: (
            <BasicPage
              title="量化精英"
              basic={products.data?.plus ?? []}
              type={subscribeType}
              onSubmit={v => cashier.open(v)}
            />
          ),
          group: <GroupPage title="聊天社群" type={subscribeType} onSubmit={v => cashier.open(v)} />,
          increment: <IncrementPage increment={products.data?.increment ?? []} title="增值包" type={subscribeType} onSubmit={v => cashier.open(v)} />
        }[version] ?? null}
      </div>
      {['basic', 'plus', 'increment'].includes(version) ? (
        <div className="mt-8">
          <IntroPage intro={products.data?.intro ?? []} />
        </div>
      ) : null}
      {cashier.context}
    </div>
  )
}

//收银台
const CashierPage = () => {
  const form = useFormContext()
  const name = form.getValues('name')
  const price = form.getValues('price')
  const model = form.getValues('model')
  const productId = form.getValues('productId')
  const [type, setType] = useState<string>()
  const [loading, { setTrue, setFalse }] = useBoolean(false)
  const checkTimer = useRef<number>()

  const { toast } = useToast()

  const payments = useQuery({
    queryKey: [getPaymentTypes.cacheKey],
    queryFn: getPaymentTypes
  })

  const types = useMemo(() => payments.data ?? [], [payments.data])

  useEffect(() => {
    if (payments.data?.length) {
      setType(payments.data[0].type)
    }
  }, [payments.data])

  const onBuy = async () => {
    setTrue()

    const params: Parameters<typeof createMallProductOrder>[0] = {
      model: model,
      number: 1,
      product_id: productId,
      platform: type!
    }

    const [err, res] = await to(createMallProductOrder(params))

    if (err) {
      setFalse()
      toast({ description: err.message })
      return
    }

    window.open(res.config.url)
    checkStatus(res.pay_sn)
  }

  const checkStatus = async (paySn: string) => {
    if (checkTimer.current) {
      clearTimeout(checkTimer.current)
    }

    const r = await checkMallProductOrderStatus(paySn)

    if (r.pay_status === '1') {
      setFalse()
      toast({ description: '支付成功' })
      //重载页面
      window.location.reload()
      return
    }

    checkTimer.current = window.setTimeout(() => {
      checkStatus(paySn)
    }, 1000)
  }

  console.log(type)

  return (
    <div className="text-sm pb-10">
      <div className="px-4 border-0 border-b border-solid border-border pb-2">
        <div className="my-2">商品名称: {name}</div>
        <div className="flex justify-between">
          <span>
            商品价格: ${price}/{model === 'model_year' ? '年' : model === 'model_month' ? '月' : '未知'}
          </span>
          <span>付款方式: {model === 'model_year' ? '包年订阅' : model === 'model_month' ? '包月订阅' : '未知'}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-center">请选择支付方式</p>
        {
          payments.isLoading ? (
            <div className="space-y-3 my-8">
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-full h-4" />
            </div>
          ) : (
            <div className="min-h-48 px-8">
              <RadioGroup value={type} onValueChange={setType} className="flex items-center justify-between flex-wrap px-4">
                {types.map(t => (
                  <div className="flex items-center space-x-2 mb-4" key={t.type}>
                    <RadioGroupItem key={t.type} value={t.type} id={`mall-payment-${t.type}`} />
                    <Label htmlFor={`mall-payment-${t.type}`}>
                      <JknIcon
                        className="w-32 h-10 rounded-none"
                        name={t.type === 'paypal' ? 'ic_paypal_pay' : t.type === 'stripe' ? 'ic_stripe_pay' : t.type === 'wechat' ? 'ic_wechat_pay' : t.type === 'alipay' ? 'ic_alipay' : (t as any)}
                      />
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )
        }
        {
          type ? (
            <Button type="button" onClick={() => onBuy()}>
              跳转 {type} 支付
            </Button>
          ) : null
        }
      </div >

      {loading && (
        <div className="fixed left-0 right-0 bottom-0 top-0 bg-background/45 flex items-center justify-center">
          <div className="w-60 bg-background/95 p-12 flex flex-col items-center">
            <JknIcon className="w-48 h-48" name="load" />
            <div className="text-center mt-4">加载中</div>
          </div>
        </div>
      )}
    </div >
  )
}

export default MallPage
