import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, JknIcon } from "@/components"
import { kChartUtils, useKChartStore, type ViewMode } from "../lib"
import { useCallback } from "react"


export const ViewModeSelect = () => {
  const viewMode = useKChartStore(s => s.viewMode)

  const setViewMode = useCallback((params: { viewMode: string }) => {
    kChartUtils.setViewMode({ viewMode: params.viewMode as ViewMode })
  }, [])


  return (
    <div className="flex items-center text-xs space-x-2">
      <div>多图显示：</div>
      <JknIcon label="单图" className="w-4 h-4 rounded-none" name="frame_1" checked={viewMode === 'single'} onClick={() => setViewMode({ viewMode: 'single' })} />
      <DoubleViewMode check={viewMode.includes('double')} onClick={(s) => setViewMode({ viewMode: s })} />
      <ThreeViewMode check={viewMode.includes('three')} onClick={(s) => setViewMode({ viewMode: s })} />
      <JknIcon label="4图" className="w-4 h-4 rounded-none" name="frame_4" checked={viewMode === 'four'} onClick={() => setViewMode({ viewMode: 'four' })} />
      <JknIcon label="6图" className="w-4 h-4 rounded-none" name="frame_5" checked={viewMode === 'six'} onClick={() => setViewMode({ viewMode: 'six' })} />
      <JknIcon label="9图" className="w-4 h-4 rounded-none" name="frame_6" checked={viewMode === 'nine'} onClick={() => setViewMode({ viewMode: 'nine' })} />
    </div>
  )
}

const DoubleViewMode = ({ check, onClick }: { check: boolean, onClick: (s: ViewMode) => void }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button reset className="h-auto">
          <JknIcon label="2图" name="frame_2" className="w-4 h-4 rounded-none" checked={check} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="">
        <DropdownMenuItem className="w-5" onClick={() => onClick('double')}><JknIcon name="frame_2_1" className="rounded-none" /></DropdownMenuItem>
        <DropdownMenuItem className="w-5" onClick={() => onClick('double-vertical')}><JknIcon name="frame_2_2" className="rounded-none" /></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const ThreeViewMode = ({ check, onClick }: { check: boolean, onClick: (s: ViewMode) => void }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button reset className="h-auto">
          <JknIcon label="3图" name="frame_3" className="w-4 h-4 rounded-none" checked={check} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="">
        <DropdownMenuItem className="w-5" onClick={() => onClick('three-vertical-top-single')}><JknIcon name="frame_3_1" className="rounded-none" /></DropdownMenuItem>
        <DropdownMenuItem className="w-5" onClick={() => onClick('three-vertical-bottom-single')}><JknIcon name="frame_3_2" className="rounded-none" /></DropdownMenuItem>
        <DropdownMenuItem className="w-5" onClick={() => onClick('three-left-single')}><JknIcon name="frame_3_3" className="rounded-none" /></DropdownMenuItem>
        <DropdownMenuItem className="w-5" onClick={() => onClick('three-right-single')}><JknIcon name="frame_3_4" className="rounded-none" /></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}