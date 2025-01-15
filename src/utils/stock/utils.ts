import { StockChartInterval, type StockExtendResultMap, type StockRawRecord } from '@/api'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import { type Stock, StockRecord, type StockResultRecord, type StockTrading } from './stock'
import type { StockSubscribeHandler } from './subscribe'

export const stockUtils = {
  toStockRecord(data: StockResultRecord) {
    return StockRecord.create(data)
  },

  toSimpleStockRecord(data: StockRawRecord, symbol?: string, name?: string) {
    return StockRecord.of(symbol ?? '', name ?? '', data)
  },

  cloneFrom(data: StockRecord) {
    return StockRecord.of(data.symbol, data.name, data.rawRecord, data.extend)
  },

  toStock(data: StockRawRecord, opts?: { extend?: StockExtendResultMap; name?: string; symbol?: string }): Stock {
    const stock: Stock = {
      name: opts?.name ?? '',
      symbol: opts?.symbol ?? '',
      timestamp: parseTime(data[0]),
      open: Decimal.create(data[1]).toNumber(),
      close: Decimal.create(data[2]).toNumber(),
      high: Decimal.create(data[3]).toNumber(),
      low: Decimal.create(data[4]).toNumber(),
      volume: Decimal.create(data[5]).toNumber(),
      turnover: data[6] ? Decimal.create(data[5]).mul(10000).toNumber()  : Decimal.create(data[5]).toNumber(),
      extend: opts?.extend
    } as Stock

    if (data.length === 10) {
      stock.cumulativeVolume = data[7]
      stock.cumulativeTurnover = data[8]
      stock.prevClose = data[9]
    } else {
      stock.cumulativeVolume = 0
      stock.cumulativeTurnover = 0
      stock.prevClose = data[7]
    }

    if (opts?.extend) {
      stock.totalShare = opts?.extend.total_share
      stock.industry = opts?.extend.basic_index
      stock.thumbs = opts?.extend.thumbs
    }

    return stock
  },

  toStockWithExt(
    data: StockRawRecord,
    opts?: { extend?: StockExtendResultMap; name?: string; symbol?: string }
  ): Stock & { percent?: number; marketValue?: number; pe?: number; pb?: number; turnoverRate?: number } {
    const stock = stockUtils.toStock(data, opts) as Stock & {
      percent?: number
      marketValue?: number
      pe?: number
      pb?: number
      turnoverRate?: number
    }

    stock.percent = stockUtils.getPercent(stock)
    stock.marketValue = stockUtils.getMarketValue(stock)
    stock.pe = stockUtils.getPE(stock)
    stock.pb = stockUtils.getPB(stock)
    stock.turnoverRate = stockUtils.getTurnOverRate(stock)

    return stock
  },

  toRawRecord(data: Stock): StockRawRecord {
    const dateStr = dayjs(data.timestamp).tz('America/New_York').format('YYYY-MM-DD HH:mm:ss')
    return [
      dateStr,
      data.open,
      data.close,
      data.high,
      data.low,
      data.volume,
      data.turnover,
      data.cumulativeVolume ?? 0,
      data.cumulativeTurnover ?? 0,
      data.prevClose
    ]
  },

  toShortRawRecord(data: Stock): StockRawRecord {
    const dateStr = dayjs(data.timestamp).tz('America/New_York').format('YYYY-MM-DD HH:mm:ss')
    return [dateStr, data.open, data.close, data.high, data.low, data.volume, data.turnover, data.prevClose]
  },

  intervalToStr(interval: number) {
    switch (interval) {
      case -1:
        return '盘前分时'
      case 0:
        return '盘中分时'
      case -2:
        return '盘后分时'
      case 7200:
        return '多日分时'
      case 1:
        return '1分'
      case 2:
        return '2分'
      case 3:
        return '3分'
      case 5:
        return '5分'
      case 10:
        return '10分'
      case 15:
        return '15分'
      case 30:
        return '30分'
      case 45:
        return '45分'
      case 60:
        return '1小时'
      case 120:
        return '2小时'
      case 180:
        return '3小时'
      case 240:
        return '4小时'
      case 1440:
        return '日线'
      case 10080:
        return '周线'
      case 43200:
        return '月线'
      case 129600:
        return '季线'
      case 259200:
        return '半年'
      case 518400:
        return '年线'
      default:
        return '-'
    }
  },

  intervalToTrading(interval: StockChartInterval): StockTrading | undefined {
    switch (interval) {
      case StockChartInterval.PRE_MARKET:
        return 'preMarket'
      case StockChartInterval.INTRA_DAY:
        return 'intraDay'
      case StockChartInterval.AFTER_HOURS:
        return 'afterHours'
      default:
        return undefined
    }
  },

  /**
   * 交易阶段
   * 盘前交易时间（Premarket Trading）：
   * 4:00 AM - 9:30 AM 美国东部时间
   * 盘中交易时间（Regular Market Hours）：
   * 9:30 AM - 4:00 PM 美国东部时间
   * 盘后交易时间（After-hours Trading）：
   * 4:00 PM - 8:00 PM 美国东部时间
   */
  getTrading: (time: Stock['timestamp']): StockTrading => {
    const usTime = dayjs(time)

    if (
      usTime.isSameOrAfter(usTime.hour(4).minute(0).second(0)) &&
      usTime.isBefore(usTime.hour(9).minute(30).second(0))
    ) {
      return 'preMarket'
    }

    if (
      usTime.isSameOrAfter(usTime.hour(9).minute(30).second(0)) &&
      usTime.isBefore(usTime.hour(16).minute(0).second(0))
    ) {
      return 'intraDay'
    }

    if (
      usTime.isSameOrAfter(usTime.hour(16).minute(0).second(0)) &&
      usTime.isBefore(usTime.hour(20).minute(0).second(0))
    ) {
      return 'afterHours'
    }

    return 'close'
  },
  /**
   * 涨幅
   */
  getPercent: (stock: Stock, decimal?: number, percent?: boolean): number | undefined => {
    if (!stock.prevClose) return
    let n = Decimal.create(stock.close).minus(stock.prevClose).div(stock.prevClose)
    if (percent) {
      n = n.mul(100)
    }
    if (decimal !== undefined) {
      return n.toDP(decimal).toNumber()
    }

    return n.toNumber()
  },
  /**
   * 涨跌额
   */
  getPercentAmount: (stock: Stock, decimal?: number): number => {
    const n = Decimal.create(stock.close).minus(stock.prevClose)

    if (decimal !== undefined) {
      return n.toDP(decimal).toNumber()
    }

    return n.toNumber()
  },
  /**
   * 是否涨
   */
  isUp: (stock: Stock): boolean => {
    return stock.close > stock.prevClose
  },
  /**
   * 市值
   */
  getMarketValue: (stock: RequiredBy<Stock, 'close'>): number | undefined => {
    if (!stock.totalShare) return
    return stock.close * stock.totalShare
  },
  /**
   * 换手率
   */
  getTurnOverRate: (stock: Stock) => {
    const marketValue = stockUtils.getMarketValue(stock)

    if (!marketValue) return

    return stock.turnover / marketValue
  },
  /**
   * 市盈率(PE)
   */
  getPE: (stock: Stock) => {
    if (!stock.extend?.net_income_loss) return
    const marketValue = stockUtils.getMarketValue(stock)
    if (!marketValue) return

    return marketValue / stock.extend.net_income_loss
  },
  /**
   * 市净率(PB)
   */
  getPB: (stock: Stock) => {
    if (!stock.extend?.liabilities_and_equity || !stock.extend?.liabilities || !stock.totalShare) return

    return stock.close / ((stock.extend.liabilities_and_equity - stock.extend.liabilities) / stock.totalShare)
  },

  /**
   * 计算订阅的市场总值
   */
  getSubscribeMarketValue: (stock: Partial<Stock>, data: Parameters<StockSubscribeHandler<'quote'>>[0]['record']) => {
    if (!stock.totalShare) return
    return data.close * stock.totalShare
  },

  /**
   * 计算订阅的换手率
   */
  getSubscribeTurnOverRate: (stock: Partial<Stock>, data: Parameters<StockSubscribeHandler<'quote'>>[0]['record']) => {
    const marketValue = stockUtils.getSubscribeMarketValue(stock, data)

    if (!marketValue) return

    return data.turnover / marketValue
  }
}

/**
 * 判断时间数据
 * 2024-09-10 不带时间默认为盘中数据，自动补齐
 * @param time 添加时间戳
 */
const parseTime = (time?: string) => {
  if (!time) return -1
  if (time.replace('-', '').length === time.length) {
    if (time.length === 10) {
      return dayjs(+time * 1000).valueOf()
    }
    return dayjs(+time).valueOf()
  }
  if (time.length === 10) {
    return dayjs(`${dayjs(time).format('YYYY-MM-DD')} 15:59:00`).valueOf()
  }
  return dayjs(time).valueOf()
}
