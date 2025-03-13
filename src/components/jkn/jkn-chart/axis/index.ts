import type { XAxisTemplate } from 'jkn-kline-chart'

export const fixedXAxis: XAxisTemplate = {
  name: 'fixedXAxis',
  scrollZoomEnabled: false,
  createTicks: ({ defaultTicks, range, bounding }) => {
    // return defaultTicks.map(({ coord, value }) => {
    //   const date = new Date(value)
    //   const year = date.getFullYear()
    //   const month = `${date.getMonth() + 1}`.padStart(2, '0')
    //   const day = `${date.getDate()}`.padStart(2, '0')
    //   console.log(coord, value)
    //   return {
    //     coord,
    //     value,
    //     text: `${day}/${month}/${year}`
    //   }
    // })
    // console.log(bounding, defaultTicks)
    return [
      {
        coord: 0,
        value:1741852800000,
        text: `123`
      },
      {
        coord: bounding.width,
        value:1741855500000,
        text: `456`
      }
    ]
  }
}
