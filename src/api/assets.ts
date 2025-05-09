import { useIndicator } from '@/store'
import request from '@/utils/request'
import { gzDecode } from '@/utils/string'
import axios from 'axios'
import dayjs from 'dayjs'
import { md5 } from 'js-md5'
import { sha256 } from 'js-sha256'
import { customAlphabet } from 'nanoid'
import { isString } from 'radash'

//账户信息
export const getAccountInfo = () => {
    return request.get('/qs-svc/account/wallet').then(r => r.data)
}

getAccountInfo.cacheKey = 'assets:account:info'


type AddDepositType = {
    account_id: string,
    amount: number
}

//存款
export const saveAccountAddDeposit = (params: AddDepositType) => {
    return request.post('/qs-svc/account/wallet/topup', params)
}

getAccountInfo.cacheKey = 'assets:account:walletTopup'

//撤退
export const saveAccountWithdraw = (params: AddDepositType) => {
    return request.post('/qs-svc/account/wallet/withdraw', params)
}

getAccountInfo.cacheKey = 'assets:account:walletWithdraw'

export interface TradesParamsType {
    /**
     * 条件
     */
    condition: Condition;
    /**
     * 买卖方向：1 买入；2 卖出
     */
    direction: number;
    /**
     * 股票代码
     */
    symbol: string | undefined;
    /**
     * 交易类型：1 常规；2 AI追踪
     */
    type: number;
    [property: string]: any;
}

/**
 * 条件
 */
export interface Condition {
    /**
     * AI追踪参数【AI追踪必传】
     */
    ai_params?: AiParam[];
    /**
     * 常规参数【常规必传】
     */
    params?: Param[];
    [property: string]: any;
}

export interface AiParam {
    /**
     * 浮动值，type为1值按百分比，例如：0.05表示5%，2值按浮点数【正数则为涨，负数则为跌】
     */
    change_value: number;
    /**
     * 基准价格
     */
    price: number;
    /**
     * 数量
     */
    quantity: number;
    /**
     * 类型：1 涨跌比例；2 价格差额
     */
    type: number;
    [property: string]: any;
}

export interface Param {
    /**
     * 价格
     */
    price: number;
    /**
     * 数量
     */
    quantity: number;
    /**
     * 触发类型：1 涨；2 跌
     */
    trigger: number;
    [property: string]: any;
}

export const saveTrades = async (params: TradesParamsType) => {
    return request.post('/qs-svc/trades', params)
}

export const getTradesList = (params: { symbol: string, page?: number, limit?: number, starTime: Date | undefined, endTime: Date | undefined }) => {
    return request.get('/qs-svc/trades', { params }).then(r => r.data)
}

getTradesList.cacheKey = 'assets:trades:list'


export const delTadesCancel = (params: { trade_ids: string }) => {
    return request.post('/qs-svc/trades/cancel', params)
}


export const getInvestStocks = ({ params }: { params: Record<string, any> }) => {
    return request.get('/qs-svc/invest/stocks', { params }).then(r => r.data)
}

getInvestStocks.cacheKey = 'assets:invest:stocks'

export const getStockChartKline = ( params ) => {
    return request.get('/chart/kline', { params })
}

getStockChartKline.key = 'assets:stock:chart:kline'
