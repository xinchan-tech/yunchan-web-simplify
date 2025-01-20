import { checkMallProductOrderStatus, createMallProductOrder, getMallProducts } from "@/api"
import { Button, JknIcon, Label, RadioGroup, RadioGroupItem, ToggleGroup, ToggleGroupItem } from "@/components"
import { JknIconCheckbox } from "@/components/jkn/jkn-icon/icon-checkbox"
import { useToast } from "@/hooks"
import { useQuery } from "@tanstack/react-query"
import { useBoolean, useUpdateEffect } from "ahooks"
import to from "await-to-js"
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react"

const MallPage = () => {
  const products = useQuery({
    queryKey: [getMallProducts.cacheKey],
    queryFn: getMallProducts
  })

  const [activeType, setActiveType] = useState<string>(products.data?.categorys[0].id ?? '')
  const [version, setVersion] = useState<'general' | 'professional'>('general')
  const [subscribeType, setSubscribeType] = useState<string>('model_month')
  const [subscribeTypes, setSubscribeTypes] = useState<{ name: string; type: string }[]>([])
  const [loading, { setTrue, setFalse }] = useBoolean(false)
  const checkTimer = useRef<number>()

  useUpdateEffect(() => {
    setActiveType(s => {
      if (!s) {
        return products.data?.categorys[0].id ?? ''
      }

      const _s = products.data?.categorys.find(category => category.id === s)

      if (!_s) {
        return products.data?.categorys[0].id ?? ''
      }

      return s
    })

  }, [products.data])


  // 套餐
  const packages = useMemo(() => {
    return products.data?.categorys.find(category => category.id === activeType)?.items?.[version] ?? []
  }, [activeType, products.data, version])

  useEffect(() => {
    const ts: Record<string, string> = {}

    packages.forEach(p => {
      p.products.forEach(product => {
        ts[product.model] = product.name
      })
    })

    if (Object.keys(ts).length) {
      setSubscribeTypes(Object.entries(ts).map(([type, name]) => ({ name, type })))
    }

  }, [packages])

  const { toast } = useToast()

  const onBuy = async (productId: string) => {
    setTrue()

    const params: Parameters<typeof createMallProductOrder>[0] = {
      model: subscribeType,
      number: 1,
      product_id: productId,
      platform: 'paypal'
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

    if (r.pay_status === 1) {
      setFalse()
      toast({ description: '支付成功' })
      //重载页面
      window.location.reload()
      return
    }

    checkTimer.current = window.setTimeout(() => {
      checkStatus(paySn)
    }, 2000)
  }

  return (
    <div className="flex flex-col items-center h-full overflow-hidden">
      {/* <div className="flex-shrink-0 w-full bg-muted py-1 border-0 border-b border-solid border-border">
        <CapsuleTabs activeKey={activeType} onChange={setActiveType} >
          {
            products.data?.categorys.map((category) => (
              <CapsuleTabs.Tab key={category.id} value={category.id} label={category.name} />
            ))
          }
        </CapsuleTabs>
      </div> */}
      <div className="flex flex-col items-center flex-1 overflow-auto">
        <ToggleGroup type="single" value={version} onValueChange={(v: typeof version) => setVersion(v)} className="my-12 gap-0">
          <ToggleGroupItem className="w-32 rounded-none rounded-l-3xl" title="大众版" value="general" >大众软件</ToggleGroupItem>
          <ToggleGroupItem className="w-32 rounded-none rounded-r-3xl" title="专业版 PRO" value="professional" >专业版 PRO</ToggleGroupItem>
        </ToggleGroup>
        <div className="text-center text-4xl font-bold">
          美股会员服务-投资的方案
        </div>
        <div className="my-8">
          <RadioGroup className="flex space-x-8" value={subscribeType} onValueChange={(value) => setSubscribeType(value)}>
            {
              subscribeTypes.map(st => (
                <div className="flex items-center space-x-2" key={st.type}>
                  <RadioGroupItem value={st.type} id={`mall-product-${st.type}`} style={{ '--foreground': 'var(--primary)' } as CSSProperties} />
                  <Label htmlFor={`mall-product-${st.type}`}>
                    {st.name}
                  </Label>
                </div>
              ))
            }
          </RadioGroup>
        </div>
        <div className="flex">
          {
            packages?.map(p => {
              return (
                <div className="w-60 text-center box-border px-4" key={p.id} >
                  <div className="text-lg font-bold">{p.name}</div>
                  <div className="my-2 font-bold">
                    <span className="text-4xl">{p.model_month}</span><span className="text-tertiary">&nbsp;/&nbsp;月</span>
                  </div>
                  <div>
                    {
                      subscribeType !== 'model_month' ? (
                        <span>
                          {p.products.find(product => product.model === subscribeType)?.price}/{p.products.find(product => product.model === subscribeType)?.unit}
                        </span>
                      ) : null
                    }
                  </div>
                  <div className="text-xs">
                    {p.describe}
                  </div>
                  <div className="text-left space-y-2 text-xs mt-8 pl-2">
                    {
                      p.publicize.map(publicize => (
                        <div key={publicize.id} className="flex items-center space-x-2">
                          <JknIconCheckbox className="w-3 h-3" checked={publicize.auth !== 'no'} checkedIcon="ic_have" uncheckedIcon="ic_not" />
                          <span >{publicize.title}</span>
                        </div>
                      ))
                    }
                  </div>
                  <div className="mt-2">
                    <Button className="w-full mt-4" onClick={() => onBuy(p.id)}>点击购买</Button>
                  </div>
                </div>
              )
            })
          }
        </div>
        <div className="mt-12 text-secondary">
          <div className="flex items-center my-2 ">
            <div className="w-64 text-lg">方案比较</div>
            {
              packages.map(p => <div key={p.id} className="w-32 text-sm text-center">{p.name}</div>)
            }
          </div>
          <div className="space-y-6">
            {
              products.data?.product_publicizes.map(publicize => (
                <div key={publicize.id} className="space-y-4">
                  <div className="w-full">{publicize.title}</div>
                  {
                    publicize.items.map(item => (
                      <div key={item.id} className="flex items-center">
                        <div className="w-64 box-border pl-4">{item.title}</div>
                        {
                          (version === 'general' ? item.product_nums_g : item.product_nums_p).map((product_num, index) => (
                            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                            <div key={index} className="w-32 text-center">
                              <JknIconCheckbox className="w-3 h-3" checked={product_num !== 'no'} checkedIcon="ic_have" uncheckedIcon="ic_not" />
                            </div>
                          ))
                        }

                      </div>
                    ))
                  }
                </div>
              ))
            }
          </div>
        </div>
      </div>
      {
        loading && (<div className="fixed left-0 right-0 bottom-0 top-0 bg-background/45 flex items-center justify-center">
          <div className="w-60 bg-background/95 p-12 flex flex-col items-center">
            <JknIcon className="w-48 h-48" name="load" />
            <div className="text-center mt-4">加载中</div>
          </div>
        </div>
        )
      }
    </div>
  )
}

export default MallPage