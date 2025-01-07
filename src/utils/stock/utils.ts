import { StockRecord, type StockResultRecord } from './stock'
import type { StockChartInterval, StockRawRecord } from '@/api'

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
  }
}
