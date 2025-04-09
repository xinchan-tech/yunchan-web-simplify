import request from '@/utils/request'

type GetMallProductsResult = {
  basic: {
    apple_iap_month: string
    apple_iap_year: string
    cover: string
    discount: string
    give_num: string
    grade: string
    id: string
    is_hot: string
    model_month: string
    model_year: string
    name: string
    professional: string
    has_channel: number
    forbidden?: string
    publicize: [number, string, any?][]
  }[]
  plus: GetMallProductsResult['basic']
  intro: {
    id: string
    title: string
    items: [
      {
        auths: string[]
        title: string
      }
    ]
  }[]
  increment: {
    cover: string
    discount: string
    give_num: string
    id: string
    is_hot: string
    model_month: string
    model_year: string
    forbidden?: string
    name: string
    professional: string
  }[]
  payment: string[]
}

export const getMallProducts = () => {
  return request.get<GetMallProductsResult>('/products').then(r => r.data)
}
getMallProducts.cacheKey = 'mall:products'

type CreateMallProductOrderParams = {
  product_id: string
  model: string
  number: number
  remark?: string
  platform: string
  order_id?: string
}

type CreateMallProductOrderResult = {
  pay_sn: string
  order_info: {
    id: string
    name: string
    model: string
    order_sn: string
    price: string
    create_time: string
  }
  config: {
    url: string
    type: string
  }
}

export const createMallProductOrder = (params: CreateMallProductOrderParams) => {
  return request
    .post<CreateMallProductOrderResult>('/order/productSave', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    .then(r => r.data)
}

export const checkMallProductOrderStatus = (paySn: string) => {
  return request.get<{ pay_status: '0' | '1' }>(`/order/pay/payStatus?pay_sn=${paySn}`).then(r => r.data)
}

/**
 * 开通的支付列表
 * @returns
 */
export const getPaymentTypes = () => {
  return request.get<{ logo: string; type: string; name: string }[]>('/payment/types').then(r => r.data)
}

getPaymentTypes.cacheKey = 'mall:paymentTypes'


type PaymentBillProduct = {
  id: string
  name: string
  status: string
  subscribe_status: string
  next_pay_time: string
  expire_time: string
  model: string
  subscribe_period: string
  price: string
  platform: string
  create_time: string
  status_text: string
  subscribe_status_text: string
}


export interface GetPaymentListResult {
  product: PaymentBillProduct[]
  channel: any[]
}

/**
 * 账单列表
 */
export const getPaymentList = () => {
  return request.get<GetPaymentListResult>('/user/getPayment').then(r => r.data) 
}
getPaymentList.cacheKey = 'mall:paymentList'