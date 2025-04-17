import {
  checkMallProductOrderStatus,
  createMallProductOrder,
  getChannelDetail,
  getMallProducts,
  getPaymentTypes,
  joinGroupService
} from '@/api'
import { useToast } from '@/hooks'
import { useUser } from '@/store'
import { cn } from '@/utils/style'
import { useQuery } from '@tanstack/react-query'
import { useBoolean, useMount, useUnmount } from 'ahooks'
import to from 'await-to-js'
import copy from 'copy-to-clipboard'
import Decimal from 'decimal.js'
import QRCode from 'qrcode'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AgreementTerms } from '../agreement'
import { JknAlert } from '../jkn/jkn-alert'
import { JknIcon } from '../jkn/jkn-icon'
import { useModal } from '../modal'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { ScrollArea } from '../ui/scroll-area'
import { Skeleton } from '../ui/skeleton'
import { Switch } from '../ui/switch'

interface MallPackagesProps {
  showMore: () => void
}

export const MallPackages = (props: MallPackagesProps) => {
  const products = useQuery({
    queryKey: [getMallProducts.cacheKey],
    queryFn: getMallProducts,
    select: data => {
      return {
        packages: [...data.basic.filter(item => item.id !== '28' && item.name !== '新手版'), ...data.plus],
        intro: data.intro,
        payment: data.payment,
        increment: data.increment
      }
    }
  })
  const [form, setForm] = useState<CashierProps['form']>({} as CashierProps['form'])

  const [activeProductId, setActiveProductId] = useState<string | null>('33')

  const [subscribeType, setSubscribeType] = useState<string>('model_month')

  const unit = subscribeType === 'model_month' ? '月' : '年'

  const authorized = useUser(s => s.user?.authorized)

  const { toast } = useToast()

  const onBuy = (productId: string) => {
    const product = products.data?.packages.find(item => item.id === productId)
    if (!product) {
      toast({ description: '产品不存在' })
      return
    }
    console.log(product)
    setForm({
      name: product.name,
      price: +product[subscribeType as keyof typeof product]!,
      productId,
      model: subscribeType
    })

    cashier.modal.open()
  }

  const cashier = useModal({
    title: '购买商品',
    content: <Cashier form={form} onClose={() => cashier.modal.close()} />,
    closeIcon: true,
    closeOnMaskClick: false,
    footer: null,
    onOk: async () => {},
    background: 'rgba(0, 0, 0, 0.3)'
  })

  return (
    <div className="text-foreground h-[682px] mt-20">
      {cashier.context}
      <div className="text-[48px] font-bold text-center text-foreground">
        该功能
        <br />
        仅在我们的升级方案提供
      </div>
      <div className="mt-4 mb-16">
        <div className="flex items-center justify-center">
          <div className="inline-block bg-accent rounded w-[160px] px-2 py-1 box-border mr-4">
            <span className="text-xs text-[#808080]">当前方案</span>
            <br />
            <span>{authorized?.[0]?.name}</span>
          </div>
          <div className="flex items-center justify-center space-x-[10px]">
            <span
              className={cn('text-sm', subscribeType === 'model_month' ? 'text-white font-medium' : 'text-[#DBDBDB]')}
            >
              月
            </span>
            <Switch
              checked={subscribeType === 'model_year'}
              onCheckedChange={checked => {
                setSubscribeType(checked ? 'model_year' : 'model_month')
              }}
            />
            <span
              className={cn('text-sm', subscribeType === 'model_year' ? 'text-white font-medium' : 'text-[#DBDBDB]')}
            >
              年
            </span>
          </div>
        </div>
      </div>
      <div className="flex justify-center space-x-[10px]">
        {products.data?.packages.map(product => {
          const isActive = activeProductId === product.id

          return (
            <div
              key={product.id}
              onFocus={() => {}}
              className={cn(
                'relative w-[192px] p-[1px] rounded-2xl box-border space-y-[10px] transition-all duration-300',
                isActive ? 'active-card' : 'default-card'
              )}
              onMouseOver={() => setActiveProductId(product.id)}
              onMouseLeave={() => setActiveProductId('33')}
            >
              <div
                className="py-10 px-5 rounded-2xl text-center cursor-pointer"
                style={{
                  background: isActive ? '#23211d' : '#1F1F1F'
                }}
              >
                {product.is_hot === '1' ? (
                  <div className="absolute right-[-3px] top-[-7px] w-[64px] h-[33px] flex items-center justify-center recommend-tag">
                    推荐
                  </div>
                ) : null}
                <div>
                  <div className={cn('text-sm', isActive && 'text-[#F5E1CF]')}>{product.name}</div>
                  <div className="flex items-end text-[32px] leading-none pt-5">
                    <span className={cn('price-text', isActive && 'text-[#F5E1CF]')}>
                      ${product[subscribeType as keyof typeof product]}
                    </span>
                    <span className="text-base text-[#575757] font-pingfang">/{unit}</span>
                  </div>
                  {subscribeType !== 'model_month' ? (
                    <div className="pt-[10px] text-base text-[#575757] line-through">
                      ${Decimal.create(+product.model_month * 12).toFixed(2)}/{unit}
                    </div>
                  ) : null}
                </div>
                <div className="mt-8">
                  <Button
                    block
                    size="lg"
                    className={cn(
                      'w-[160px] h-11 rounded-[8px] font-pingfang bg-transparent border-[#666666] border border-solid',
                      !isActive && 'hover:bg-[#3a3a3a] '
                    )}
                    style={{
                      background: isActive ? 'linear-gradient(to right, #FADFB0, #FECA90, #EC9B51)' : '',
                      color: isActive ? '#6A4C18' : '#F5E1CF'
                    }}
                    onClick={e => {
                      e.stopPropagation() // 阻止冒泡，避免触发卡片的点击事件
                      onBuy(product.id)
                    }}
                  >
                    立即开通
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="text-center mt-10">
        <span className="underline cursor-pointer" onKeyDown={() => void 0} onClick={() => props.showMore()}>
          查看更多
        </span>
      </div>
      <style jsx>
        {`
          /* 导入 Heebo 字体 */
          @import url("https://fonts.googleapis.com/css2?family=Heebo:wght@700&display=swap");

          /* 默认卡片样式 */
          .default-card {
            background: linear-gradient(to bottom, #2e2e2e, #1F1F1F);
          }

          /* 激活状态卡片样式 */
          .active-card {
            background: linear-gradient(to bottom, #e7c88d, #1F1F1F);
            transform: translateY(-20px);
            z-index: 10; /* 添加z-index确保active卡片在其他卡片之上 */
          }

          /* 价格文本样式 */
          .price-text {
            font-family: "Heebo", sans-serif;
            font-weight: 600;
          }

          /* 推荐标签渐变背景 */
          .recommend-tag {
            background: linear-gradient(to right, #fadfb0, #feca90, #ec9b51);
            border-top-left-radius: 4px;
            border-top-right-radius: 12px;
            border-bottom-left-radius: 12px;
            border-bottom-right-radius: 4px;
            color: #6a4c18;
            font-size: 16px;
          }

          /* 渐变文本样式 */
          :global(.gradient-text) {
            background: linear-gradient(to right, #fadfb0, #feca90, #ec9b51);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            font-weight: 500;
          }

          /* 添加HoverCard内容的z-index样式 */
          :global(.hover-card-content) {
            z-index: 50 !important; /* 确保HoverCard内容始终在最上层 */
          }
        `}
      </style>
    </div>
  )
}

const gotoPayPage = (url: string) => {
  const a = document.createElement('a')
  a.href = url
  a.id = 'pay-link'
  a.target = '_blank'
  if (document.querySelector('#pay-link')) {
    document.body.removeChild(document.querySelector('#pay-link')!)
  }
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

interface CashierProps {
  form: {
    name: string
    price: number
    model: string
    productId: string
    productType?: string
  }
  onClose: () => void
}

//收银台
export const Cashier = (props: CashierProps) => {
  const { name, price, model, productId, productType } = props.form
  const [type, setType] = useState<string>()
  const [loading, { setTrue, setFalse }] = useBoolean(false)
  const checkTimer = useRef<number>()
  const [payStatus, setPayStatus] = useState<'pre' | 'paying' | 'paid'>('pre')
  const [payUrl, setPayUrl] = useState('')
  const { toast } = useToast()
  const refreshUser = useUser(s => s.refreshUser)

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

    const [err, res] = await to(productType === 'group' ? buyGroupProduct() : buyNormalProduct())
    setFalse()
    if (err) {
      toast({ description: err.message })
      return
    }
    setPayUrl(res.url)
    if (res.type === 'qr_code') {
      qrCode.modal.open()
    } else {
      gotoPayPage(res.url)
    }
    setPayStatus('paying')
    checkStatus(res.pay_sn)
  }

  const buyNormalProduct = async () => {
    const params: Parameters<typeof createMallProductOrder>[0] = {
      model: model,
      number: 1,
      product_id: productId,
      platform: type!
    }

    const res = await createMallProductOrder(params)

    return {
      type: res.config.type,
      url: res.config.url,
      pay_sn: res.pay_sn
    }
  }

  const buyGroupProduct = async () => {
    const channelInfo = await getChannelDetail(productId)

    const product = channelInfo.products.find(p => p.type === model.replace('model_', ''))

    if (!product) {
      throw new Error('社群信息不完整')
    }

    const params = {
      payment_type: type!,
      product_sn: product.product_sn
    }

    const res = await joinGroupService(channelInfo.account, params)

    return {
      type: res.config.type,
      url: res.config.url,
      pay_sn: res.pay_sn
    }
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
      setPayStatus('paid')
      return
    }

    checkTimer.current = window.setTimeout(() => {
      checkStatus(paySn)
    }, 1000)
  }

  const qrCode = useModal({
    title: '支付二维码',
    className: 'w-[400px]',
    content: <WxCharQrCode name={name} price={Decimal.create(price).toFixed(2)} url={payUrl} />,
    footer: null,
    closeIcon: true
  })

  const checkPay = () => {
    if (payStatus !== 'paid') {
      JknAlert.info({
        content: '未验证到支付成功，请确认',
        onAction: async () => {}
      })
    } else {
      setPayUrl('')
      setPayStatus('paid')
    }
  }

  const openPay = (url: string) => {
    if (type === 'wechat') {
      // qrCode.modal.open()
    } else {
      gotoPayPage(url)
    }
  }

  const onCopyUrl = () => {
    copy(payUrl)
    toast({ description: '复制成功' })
  }

  const onChangeType = (v: string) => {
    if (payStatus !== 'pre') return

    setType(v)
  }

  useUnmount(() => {
    clearTimeout(checkTimer.current)
  })

  //协议modal
  const agreement = useModal({
    content: action => (
      <div className="p-8 leading-8">
        <ScrollArea className="border border-solid rounded-sm border-gray-700 p-4 h-[400px]">
          <AgreementTerms />
        </ScrollArea>
        <div className="text-center mt-2">
          <Button onClick={action.close}>确定</Button>
        </div>
      </div>
    ),
    title: '使用条款、政策和免责声明',
    closeIcon: true,
    footer: null
  })

  return (
    <div className="text-sm pb-5">
      <div className="text-2xl text-center">
        开通{name}
        {model === 'model_year' ? '包年' : model === 'model_month' ? '包月' : '未知'}服务
      </div>
      <div className="text-5xl text-center mt-10">
        ${Decimal.create(price).toFixed(0)}
        <span className="text-base">.{Decimal.create(price).mod(1).toFixed(2).slice(2)}</span>
      </div>
      {payStatus !== 'paid' ? (
        <div className="text-center">
          {payments.isLoading ? (
            <div className="space-y-3 my-8">
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-full h-4" />
            </div>
          ) : (
            <div className="flex w-full justify-center mt-10">
              <div className="min-h-48 pt-2 pb-4 px-4 w-[300px] box-border rounded-xl border border-solid border-[#808080]">
                <p className="w-full text-left">请选择支付方式</p>
                <RadioGroup value={type} onValueChange={onChangeType} className="flex flex-col">
                  {types.map(t => (
                    <div className="flex items-center py-2" key={t.type}>
                      <Label htmlFor={`mall-payment-${t.type}`} className="flex items-center font-normal flex-1">
                        <JknIcon
                          className="size-6 rounded-none"
                          name={
                            t.type === 'paypal'
                              ? 'paypal-icon'
                              : t.type === 'stripe'
                                ? 'stripe-icon'
                                : t.type === 'wechat'
                                  ? 'weipay-icon'
                                  : t.type === 'alipay'
                                    ? 'alipay-icon'
                                    : (t as any)
                          }
                        />
                        {t.name}
                      </Label>
                      <RadioGroupItem key={t.type} value={t.type} id={`mall-payment-${t.type}`} />
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="w-[250px] px-4 ml-2.5 flex flex-col justify-center box-border rounded-xl border border-solid border-[#808080]">
                {payStatus === 'paying' && type === 'wechat' ? (
                  <WxCharQrCode name={name} price={Decimal.create(price).toFixed(2)} url={'123'} />
                ) : null}

                <span className="text-sm text-secondary">
                  支付即表示同意
                  <span
                    className="text-primary cursor-pointer"
                    onClick={() => agreement.modal.open()}
                    onKeyDown={() => {}}
                  >
                    《软件订阅协议》
                  </span>
                </span>
                <div>
                  {type ? (
                    payStatus === 'pre' ? (
                      <Button
                        className="w-full bg-primary rounded-[300px] h-10 text-foreground mt-8"
                        onClick={() => onBuy()}
                      >
                        跳转 {type} 支付
                      </Button>
                    ) : payStatus === 'paying' ? (
                      type !== 'wechat' ? (
                        <Button
                          className="w-full bg-primary rounded-[300px] h-10 text-foreground mt-8"
                          onClick={() => openPay(payUrl)}
                        >
                          跳转 {type} 支付
                        </Button>
                      ) : null
                    ) : null
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {payStatus === 'paying' ? (
            <div className="mt-10 min-h[80px]">
              <Button
                type="button"
                variant="outline"
                className="w-[160px] h-10 rounded-[300px]"
                onClick={() => props.onClose()}
              >
                返回
              </Button>
              <Button
                type="button"
                className="w-[160px] h-10 rounded-[300px] bg-primary ml-5 text-foreground"
                onClick={() => checkPay()}
              >
                支付完成？验证支付
              </Button>

              <div className="mt-5">
                {type !== 'wechat' && (
                  <span className="text-tertiary text-xs">
                    未跳支付页面？
                    <span className="text-primary cursor-pointer" onClick={onCopyUrl} onKeyDown={() => {}}>
                      复制付款链接
                    </span>
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-10 h-[80px]" />
          )}
        </div>
      ) : (
        <div className="min-h-48 flex flex-col items-center mt-12">
          <div className="bg-stock-green rounded-full w-24 h-24 flex">
            <JknIcon className="m-auto w-16 h-16" name="dagou_white" />
          </div>
          <div className="my-8">购买成功</div>
          <Button
            type="button"
            className="w-[160px] h-10 rounded-[300px] bg-primary text-white"
            onClick={() => {
              refreshUser()
              props.onClose()
            }}
          >
            确定
          </Button>
        </div>
      )}

      {loading && (
        <div className="fixed left-0 right-0 bottom-0 top-0 bg-background/45 flex items-center justify-center">
          <div className="w-60 bg-background/95 p-12 flex flex-col items-center">
            <JknIcon className="w-48 h-48" name="load" />
            <div className="text-center mt-4">加载中</div>
          </div>
        </div>
      )}
      {qrCode.context}
      {agreement.context}
    </div>
  )
}

interface WxCharQrCodeProps {
  name: string
  price: string
  url: string
}
const WxCharQrCode = (props: WxCharQrCodeProps) => {
  useMount(() => {
    const url = props.url
    const canvas = document.querySelector('#wx-pay-qrcode') as HTMLCanvasElement
    QRCode.toCanvas(canvas, url, {
      errorCorrectionLevel: 'Q',
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      margin: 2
    })
  })
  return (
    <div className="flex w-full flex-col space-y-2 items-center text-sm text-secondary pb-2">
      <div>{props.name}</div>
      <div>{props.price}</div>
      <div>
        <canvas id="wx-pay-qrcode" className="w-[160px] h-[160px] m-auto rounded overflow-hidden" />
      </div>
      <div>请使用微信扫描二维码完成支付</div>
    </div>
  )
}
