import { IndicatorSeries, type IndicatorTemplate, type TooltipShowRule, getFigureClass } from 'jkn-kline-chart'
import { calcCoilingPivots, calcCoilingPivotsExpands, calcTradePoints, calculateMA } from './coiling-calc'



// /**
//  * 1类买卖点
//  */
// export const tradePointOneTypeCoiling: IndicatorTemplate = {
//   name: `coiling-${CoilingIndicatorId.ONE_TYPE}`,
//   shortName: 'trade-point-one-type',
//   zLevel: 1,
//   calcParams: [[]] as [CoilingData['class_1_trade_points']],
//   calc: dataList => dataList,
//   createTooltipDataSource: () => ({ name: '', icons: [], legends: [], calcParamsText: '' }),
//   draw: ({ ctx, indicator, xAxis, yAxis }) => drawTradePoint({ ctx, indicator, xAxis, yAxis } as any, 1)
// }

// export const tradePointTwoTypeCoiling: IndicatorTemplate = {
//   name: `coiling-${CoilingIndicatorId.TWO_TYPE}`,
//   shortName: 'trade-point-two-type',
//   zLevel: 1,
//   calcParams: [[]] as [CoilingData['class_2_trade_points']],
//   calc: dataList => dataList,
//   createTooltipDataSource: () => ({
//     name: '',
//     icons: [],
//     legends: [],
//     calcParamsText: ''
//   }),
//   draw: ({ ctx, indicator, xAxis, yAxis }) => drawTradePoint({ ctx, indicator, xAxis, yAxis } as any, 2)
// }

// export const tradePointThreeTypeCoiling: IndicatorTemplate = {
//   name: `coiling-${CoilingIndicatorId.THREE_TYPE}`,
//   shortName: 'trade-point-three-type',
//   zLevel: 1,
//   calcParams: [[]] as [CoilingData['class_3_trade_points']],
//   calc: dataList => dataList,
//   createTooltipDataSource: () => ({
//     name: '',
//     icons: [],
//     legends: [],
//     calcParamsText: ''
//   }),
//   draw: ({ ctx, indicator, xAxis, yAxis }) => drawTradePoint({ ctx, indicator, xAxis, yAxis } as any, 3)
// }

// const drawTradePoint = (
//   { ctx, indicator, xAxis, yAxis }: Parameters<NonNullable<IndicatorTemplate['draw']>>[0],
//   type: number
// ) => {
//   const coilingData = indicator.calcParams[0] as CoilingData['class_1_trade_points']

//   const Line = getFigureClass('line')!
//   const Circle = getFigureClass('circle')!
//   const Text = getFigureClass('text')!

//   if (!coilingData?.length) return false

//   const result = calcTradePoints(coilingData)

//   result.forEach(p => {
//     const y = yAxis.convertToPixel(p.price)
//     const x = xAxis.convertToPixel(p.index)
//     const height = y + (!p.buy ? -1 : 1) * 30
//     const cy = height + (!p.buy ? -1 : 1) * 12

//     new Line({
//       name: 'line',
//       attrs: {
//         coordinates: [
//           { x: x, y: y },
//           { x: x, y: height }
//         ]
//       },
//       styles: {
//         color: p.color,
//         size: 1,
//         style: 'dashed'
//       }
//     }).draw(ctx) // Added .draw(ctx) to ensure the line is drawn on the context
//     new Circle({
//       name: 'circle',
//       attrs: {
//         x: x,
//         y: cy,
//         r: 12
//       },
//       styles: {
//         color: p.color
//       }
//     }).draw(ctx)
//     new Text({
//       name: 'text',
//       attrs: {
//         x: x,
//         y: cy,
//         text: `${type}${p.buy ? '买' : '卖'}`,
//         align: 'center',
//         baseline: 'middle'
//       },
//       styles: {
//         color: '#fff',
//         fontSize: 12
//       }
//     }).draw(ctx)
//   })

//   return true
// }

// /**
//  * 短线王
//  */
// export const shortLineCoiling: IndicatorTemplate = {
//   name: `coiling-${CoilingIndicatorId.SHORT_LINE}`,
//   shortName: 'short-line',
//   series: IndicatorSeries.Price,
//   calcParams: [20, 30],
//   precision: 2,
//   figures: [
//     { key: 'ma20', type: 'line', styles: () => ({ color: 'rgb(186, 64, 127)' }) },
//     { key: 'ma30', type: 'line', styles: () => ({ color: 'rgb(156, 171, 232)' }) }
//   ],
//   calc: (dataList, indicator) => {
//     const { calcParams: params } = indicator
//     const maData = params.map(p => calculateMA(p as number, dataList))
//     // console.log(1232, maData, dataList)

//     return dataList.map((_, i) => {
//       const ma: Record<string, number | null> = {}
//       params.forEach((f, index) => {
//         ma[`ma${f}`] = maData[index][i]
//       })

//       return ma
//     })
//   },
//   createTooltipDataSource: () => ({ name: '', icons: [], legends: [], calcParamsText: '' })
// }

// /**
//  * 主力趋势
//  */
// export const mainTrendCoiling: IndicatorTemplate = {
//   name: `coiling-${CoilingIndicatorId.MAIN}`,
//   shortName: 'main-trend',
//   series: IndicatorSeries.Price,
//   calcParams: [55, 60, 65, 120, 250],
//   precision: 2,
//   figures: [
//     { key: 'ma55', type: 'line', styles: () => ({ color: 'rgb(250,28,19)' }) },
//     { key: 'ma60', type: 'line', styles: () => ({ color: 'rgb(255,255,255)' }) },
//     { key: 'ma65', type: 'line', styles: () => ({ color: 'rgb(51,251,41)' }) },
//     { key: 'ma120', type: 'line', styles: () => ({ color: 'rgb(51,251,41)', lineWidth: 4 }) },
//     { key: 'ma250', type: 'line', styles: () => ({ color: 'rgb(249,42,251)', lineWidth: 6 }) }
//   ],
//   calc: (dataList, indicator) => {
//     const { calcParams: params } = indicator
//     const maData = params.map(p => calculateMA(p as number, dataList))

//     return dataList.map((_, i) => {
//       const ma: Record<string, number | null> = {}
//       params.forEach((f, index) => {
//         ma[`ma${f}`] = maData[index][i]
//       })

//       return ma
//     })
//   },
//   createTooltipDataSource: () => ({ name: '', icons: [], legends: [], calcParamsText: '' })
// }
