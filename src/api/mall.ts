import request from '@/utils/request'

type GetMallProductsResult = {
  categorys: {
    id: string
    name: string
    items: {
      [key: string]: {
        id: string
        product_cate_id: string
        name: string
        model_month: string
        model_quarter: string
        model_year: string
        model_half_year: string
        discount: string
        professional: string
        is_hot: string
        give_num: string
        cover: string
        describe: string
        publicize: { id: string; title: string; auth: string; product_id: string }[]
        products: {
          id: string
          product_sn: string
          platform_product: string
          platform_type: string
          price: string
          day: string
          product_id: string
          model: string
          name: string
          unit: string
        }[]
      }[]
    }
  }[]
  product_publicizes: {
    id: string
    title: string
    items: [
      {
        id: string
        product_nums_g: string[]
        product_nums_p: string[]
        product_publicize_id: string
        title: string
      }
    ]
  }[]
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
  return request.get<{ pay_status: 0 | 1 }>(`/order/pay/payStatus?pay_sn=${paySn}`).then(r => r.data)
}
