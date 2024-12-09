import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, JknIcon } from "@/components"
import { createDefaultChartState, type KChartContext, useKChartContext } from "../lib"
import { StockChartInterval } from "@/api"

const getViewMode = (s: KChartContext['viewMode']) => {
  switch (s) {
    case 'single':
      return 1
    case 'double':
      return 2
    case 'double-vertical':
      return 2
    case 'three-left-single':
      return 3
    case 'three-right-single':
      return 3
    case 'three-vertical-top-single':
      return 3
    case 'three-vertical-bottom-single':
      return 3
    case 'four':
      return 4
    case 'six':
      return 6
    case 'nine':
      return 9
    default:
      return 1
  }
}
export const ViewModeSelect = () => {
  const { viewMode, setState } = useKChartContext()

  const setViewMode = (s: KChartContext['viewMode']) => {
    setState(state => {
      const count = getViewMode(s)

      if(state.state.length > count) {
        state.state = state.state.slice(0, count)
      }else{
        for(let i = state.state.length; i < count; i++) {
          state.state.push(createDefaultChartState())
        }
      }
      state.viewMode = s
    })
  }

  return (
    <div className="flex items-center text-xs space-x-2">
      <div>多图显示：</div>
      <JknIcon className="w-4 h-4" name="frame_1" checked={viewMode === 'single'} onClick={() => setViewMode('single')} />
      <DoubleViewMode check={viewMode.includes('double')} onClick={(s) => setViewMode(s)} />
    </div>
  )
}

const DoubleViewMode = ({ check, onClick }: { check: boolean, onClick: (s: KChartContext['viewMode']) => void }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button reset className="h-auto">
          <JknIcon name="frame_2" className="w-4 h-4" checked={check} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="">
        <DropdownMenuItem className="w-5" onClick={() => onClick('double')}><JknIcon name="frame_2_1" /></DropdownMenuItem>
        <DropdownMenuItem className="w-5" onClick={() => onClick('double-vertical')}><JknIcon name="frame_2_2" /></DropdownMenuItem>
      </DropdownMenuContent>

    </DropdownMenu>
  )
}