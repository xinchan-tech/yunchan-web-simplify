import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, JknIcon } from "@/components"
import { type KChartContext, useKChartContext } from "../lib"


export const ViewModeSelect = () => {
  const { viewMode, setViewMode } = useKChartContext()


  return (
    <div className="flex items-center text-xs space-x-2">
      <div>多图显示：</div>
      <JknIcon className="w-4 h-4 rounded-none" name="frame_1" checked={viewMode === 'single'} onClick={() => setViewMode({viewMode: 'single'})} />
      <DoubleViewMode check={viewMode.includes('double')} onClick={(s) => setViewMode({viewMode: s})} />
      <ThreeViewMode check={viewMode.includes('three')} onClick={(s) => setViewMode({viewMode: s})} />
      <JknIcon className="w-4 h-4 rounded-none" name="frame_4" checked={viewMode === 'four'} onClick={() => setViewMode({viewMode: 'four'})} />
      <JknIcon className="w-4 h-4 rounded-none" name="frame_5" checked={viewMode === 'six'} onClick={() => setViewMode({viewMode: 'six'})} />
      <JknIcon className="w-4 h-4 rounded-none" name="frame_6" checked={viewMode === 'nine'} onClick={() => setViewMode({viewMode: 'nine'})} />
    </div>
  )
}

const DoubleViewMode = ({ check, onClick }: { check: boolean, onClick: (s: KChartContext['viewMode']) => void }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button reset className="h-auto">
          <JknIcon name="frame_2" className="w-4 h-4 rounded-none" checked={check} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="">
        <DropdownMenuItem className="w-5" onClick={() => onClick('double')}><JknIcon name="frame_2_1" className="rounded-none"/></DropdownMenuItem>
        <DropdownMenuItem className="w-5" onClick={() => onClick('double-vertical')}><JknIcon name="frame_2_2" className="rounded-none"/></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const ThreeViewMode = ({ check, onClick }: { check: boolean, onClick: (s: KChartContext['viewMode']) => void }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button reset className="h-auto">
          <JknIcon name="frame_3" className="w-4 h-4 rounded-none" checked={check} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="">
        <DropdownMenuItem className="w-5" onClick={() => onClick('three-vertical-top-single')}><JknIcon name="frame_3_1" className="rounded-none"/></DropdownMenuItem>
        <DropdownMenuItem className="w-5" onClick={() => onClick('three-vertical-bottom-single')}><JknIcon name="frame_3_2" className="rounded-none"/></DropdownMenuItem>
        <DropdownMenuItem className="w-5" onClick={() => onClick('three-left-single')}><JknIcon name="frame_3_3" className="rounded-none"/></DropdownMenuItem>
        <DropdownMenuItem className="w-5" onClick={() => onClick('three-right-single')}><JknIcon name="frame_3_4" className="rounded-none"/></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}