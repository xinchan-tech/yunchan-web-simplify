import mitt from "mitt"

type ChartEvent = 'tooltip' | 'indicatorChange'


export const chartEvent = {
  event: mitt<Record<ChartEvent, any>>(),
  create() {
    if(!this.event){
      this.event = mitt<Record<ChartEvent, any>>()
    }
    return this.event
  }
}
