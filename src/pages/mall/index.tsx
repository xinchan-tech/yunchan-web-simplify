import {
  checkMallProductOrderStatus,
  createMallProductOrder,
  getChannelDetail,
  getMallProducts,
  getPaymentTypes,
  joinGroupService
} from '@/api'
import {
  AgreementTerms,
  Button,
  JknAlert,
  JknIcon,
  Label,
  RadioGroup,
  RadioGroupItem,
  ScrollArea,
  Skeleton,
  useFormModal,
  useModal
} from '@/components'
import { Switch } from '@/components/ui/switch'
import { useToast, useZForm } from '@/hooks'
import { useToken } from '@/store'
import { appEvent } from '@/utils/event'
import { cn } from '@/utils/style'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useBoolean, useMount, useUnmount } from 'ahooks'
import to from 'await-to-js'
import copy from 'copy-to-clipboard'
import QRCode from 'qrcode'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { z } from 'zod'
import { BasicPage } from './basic-page'
import { GroupPage } from './group-page'
import { IncrementPage } from './increment-page'
import { IntroPage } from './intro-page'
import dayjs from "dayjs"

const versions = [
  // { name: '旗舰达人', value: 'basic' },
  // { name: '量化精英', value: 'plus' },
  // { name: '聊天社群', value: 'group' },
  { name: '特色软件', value: 'packages' }
  // { name: '增值包', value: 'increment' }
]

type Version = 'group' | 'increment' | 'packages'

const productForm = z.object({
  productId: z.string(),
  name: z.string(),
  price: z.string(),
  model: z.string(),
  checked: z.boolean(),
  productType: z.string().optional()
})

const MallPage = () => {
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

  const [version, setVersion] = useState<Version>('packages')
  const [subscribeType, setSubscribeType] = useState<string>('model_month')
  const form = useZForm(productForm, {
    productId: '',
    name: '',
    price: '',
    model: '',
    checked: false
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
    onOk: async () => { return true },
  })

  const token = useToken(s => s.token)

  const _onOpenCashier = (values: z.infer<typeof productForm>) => {
    if (!token) {
      JknAlert.info({
        content: '您还未登录，请先登录',
        onAction: async () => {
          appEvent.emit('login')
        }
      })
      return
    }

    cashier.open(values)
  }

  return (
    <div className="flex flex-col items-center h-full overflow-auto w-full box-border bg-[#0B0404]">
      <div className="text-center text-[64px] font-bold mt-10">美股软件 服务方案</div>
      <div className="flex items-center justify-center mt-10 rounded-[6px] border border-solid p-[2px]">
        {versions.map(v => (
          <Button
            key={v.value}
            className={cn(
              'w-32 h-10 text-center border border-solid text-[#DBDBDB] transition-all cursor-pointer',
              v.value === version ? 'rounded-sm bg-[#1A1A1A] border-[#1A1A1A]' : 'bg-transparent border-none'
            )}
            onClick={() => setVersion(v.value as Version)}
          >
            {v.name}
          </Button>
        ))}
      </div>
      <div className="my-10">
        <div className="flex items-center space-x-[10px]">
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
          <span className={cn('text-sm', subscribeType === 'model_year' ? 'text-white font-medium' : 'text-[#DBDBDB]')}>
            年
          </span>
        </div>
      </div>
      <div className="mt-5">
        {{
          // basic: (
          //   <BasicPage
          //     title="旗舰达人"
          //     basic={products.data?.basic ?? []}
          //     type={subscribeType}
          //     onSubmit={v => _onOpenCashier(v)}
          //   />
          // ),
          // plus: (
          //   <BasicPage
          //     title="量化精英"
          //     basic={products.data?.plus ?? []}
          //     type={subscribeType}
          //     onSubmit={v => _onOpenCashier(v)}
          //   />
          // ),
          packages: (
            <BasicPage
              title="特色软件"
              basic={products.data?.packages ?? []}
              type={subscribeType}
              onSubmit={v => _onOpenCashier(v)}
            />
          ),
          group: <GroupPage title="聊天社群" type={subscribeType} onSubmit={v => _onOpenCashier(v)} />,
          increment: (
            <IncrementPage
              increment={products.data?.increment ?? []}
              title="增值包"
              type={subscribeType}
              onSubmit={v => _onOpenCashier(v)}
            />
          )
        }[version] ?? null}
      </div>
      {['basic', 'plus', 'increment', 'packages'].includes(version) ? (
        <div className="mt-16">
          <IntroPage intro={products.data?.intro ?? []} />
        </div>
      ) : null}
      {cashier.context}
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

/**
 * TODO: 使用@/components/mall-dialog/Cashier替换
 * @returns
 */
const CashierPage = () => {
  const form = useFormContext()
  const name = form.getValues('name')
  const price = form.getValues('price')
  const model = form.getValues('model') as string
  const productId = form.getValues('productId')
  const checked = form.watch('checked')
  const productType = form.getValues('productType')

  const [type, setType] = useState<string>()
  const [loading, { setTrue, setFalse }] = useBoolean(false)
  const checkTimer = useRef<number>()
  const [payStatus, setPayStatus] = useState<'pre' | 'paying' | 'paid'>('pre')
  const [payUrl, setPayUrl] = useState('')
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
    if (!checked) {
      toast({ description: '请先同意订阅协议' })
      return
    }
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

    const code = localStorage.getItem('invite-code')

    if (code) {
      const codeObj = JSON.parse(code)
      if (codeObj.timestamp) {
        const current = dayjs()
        if (current.diff(codeObj.timestamp, 'day') <= 3) {
          params.cid = codeObj.cid
          params.inv_code = codeObj.code
        }
      }
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

  const totalPrice = useMemo(
    () => `\$${price}/${model === 'model_year' ? '年' : model === 'model_month' ? '月' : '未知'}`,
    [price, model]
  )

  const qrCode = useModal({
    title: '支付二维码',
    className: 'w-[400px]',
    content: <WxCharQrCode name={name} price={totalPrice} url={payUrl} />,
    footer: null,
    closeIcon: true
  })

  const checkPay = () => {
    if (payStatus !== 'paid') {
      JknAlert.info({
        content: '未验证到支付成功，请确认',
        onAction: async () => { }
      })
    } else {
      setPayUrl('')
      setPayStatus('paid')
    }
  }

  const openPay = (url: string) => {
    if (type === 'wechat') {
      qrCode.modal.open()
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
    <div className="text-sm pb-10">
      <div className="px-4 border-0 border-b border-solid border-border pb-2">
        <div className="my-2">商品名称: {name}</div>
        <div className="flex justify-between">
          <span>商品价格: {totalPrice}</span>
          <span>付款方式: {model === 'model_year' ? '包年订阅' : model === 'model_month' ? '包月订阅' : '未知'}</span>
        </div>
      </div>
      {payStatus !== 'paid' ? (
        <div className="text-center">
          <p className="text-center">请选择支付方式</p>
          {payments.isLoading ? (
            <div className="space-y-3 my-8">
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-full h-4" />
            </div>
          ) : (
            <div className="min-h-48 px-8">
              <RadioGroup
                value={type}
                onValueChange={onChangeType}
                className="flex items-center justify-between flex-wrap px-4"
              >
                {types.map(t => (
                  <div className="flex items-center space-x-2 mb-4" key={t.type}>
                    <RadioGroupItem key={t.type} value={t.type} id={`mall-payment-${t.type}`} />
                    <Label htmlFor={`mall-payment-${t.type}`}>
                      <JknIcon
                        className="w-32 h-10 rounded-none"
                        name={
                          t.type === 'paypal'
                            ? 'ic_paypal_pay'
                            : t.type === 'stripe'
                              ? 'ic_stripe_pay'
                              : t.type === 'wechat'
                                ? 'ic_wechat_pay'
                                : t.type === 'alipay'
                                  ? 'ic_alipay'
                                  : (t as any)
                        }
                      />
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
          <div className="w-full flex items-center px-12 mb-4">
            <JknIcon.Checkbox
              checked={checked}
              checkedIcon="checkbox_mult_sel"
              uncheckedIcon="checkbox_mult_nor"
              onClick={() => payStatus === 'pre' && form.setValue('checked', !checked)}
              className="rounded-none"
            />
            <span>
              &nbsp;我已经阅读并同意
              <span className="text-primary cursor-pointer" onClick={() => agreement.modal.open()} onKeyDown={() => { }}>
                《软件订阅协议》
              </span>
            </span>
          </div>
          {type ? (
            // payUrl ? (
            //   <Button type="button" onClick={() => checkPay()}>
            //     支付完成？验证支付
            //   </Button>
            // ) : (
            //   <Button type="button" onClick={() => onBuy()}>
            //     支付
            //   </Button>
            // )
            payStatus === 'pre' ? (
              <Button type="button" onClick={() => onBuy()}>
                支付
              </Button>
            ) : payStatus === 'paying' ? (
              <>
                <div className="space-x-4 mb-4">
                  <Button type="button" variant="outline" onClick={() => checkPay()}>
                    支付完成？验证支付
                  </Button>
                  <Button type="button" onClick={() => openPay(payUrl)}>
                    跳转 {type} 支付
                  </Button>
                </div>
                {type !== 'wechat' && (
                  <span className="text-tertiary text-xs">
                    未跳转到支付页面？复制付款
                    <span className="text-primary cursor-pointer" onClick={onCopyUrl} onKeyDown={() => { }}>
                      链接
                    </span>
                  </span>
                )}
              </>
            ) : null
          ) : null}
        </div>
      ) : (
        <div className="min-h-48 flex flex-col items-center mt-12">
          <div className="bg-stock-green rounded-full w-24 h-24 flex">
            <JknIcon className="m-auto w-16 h-16" name="dagou_white" />
          </div>
          <div className="my-8">购买成功</div>
          <Button type="button" className="w-24" onClick={() => window.location.reload()}>
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
    <div className="flex w-full flex-col space-y-2 items-center py-8">
      <div>{props.name}</div>
      <div>{props.price}</div>
      <div>
        <canvas id="wx-pay-qrcode" className="w-[160px] h-[160px] m-auto" />
      </div>
      <div>请使用微信扫描二维码完成支付</div>
    </div>
  )
}

export default MallPage
