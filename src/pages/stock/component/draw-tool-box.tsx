import { type ChartOverlayType, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, JknAlert, JknColorPicker, JknColorPickerPopover, JknIcon } from '@/components'
import { DndContext, type DragEndEvent, useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { createContext, Fragment, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'
import { chartManage, useChartManage } from '../lib'
import { chartEvent } from '../lib/event'
import { type Updater, useImmer } from "use-immer"

const defaultBar: {
  icon: ChartOverlayType
  label: string
  tool?: string[]
}[] = [
    {
      icon: 'line',
      label: '直线'
    },
    {
      icon: 'ray',
      label: '射线'
    },
    {
      icon: 'arrow',
      label: '箭头'
    },
    {
      icon: 'hline',
      label: '水平线'
    },
    {
      icon: 'vline',
      label: '垂直线'
    },
    {
      icon: 'rectangle',
      label: '矩形'
    },
    {
      icon: 'channel',
      label: '通道线'
    },
    {
      icon: 'parallel',
      label: '平行线'
    },
    {
      icon: 'gold',
      label: '黄金分割线'
    },
    {
      icon: 'time',
      label: '时空尺'
    },
    {
      icon: 'remark',
      label: '注解'
    }
  ]

const DrawToolContext = createContext<{
  color: string,
  width: number,
  type: string,
  lock: boolean,
  uid: Nullable<string>
  setDrawSetting: Updater<{
    color: string,
    width: number,
    type: string,
    lock: boolean
    uid: string
  }>
}>({} as any)

const useDrawTool = () => useContext(DrawToolContext)

export const DrawToolBox = () => {
  const [boxPoint, setBoxPoint] = useState({ x: 24, y: 240 })
  const [settingPoint, setSettingPoint] = useState({ x: 24, y: 24 })
  const [drawSelect, setDrawSelect] = useState<Nullable<ChartOverlayType>>()
  const [setting, setSetting] = useImmer({
    color: 'rgba(255, 0, 0, 1)',
    width: 1,
    type: 'solid',
    lock: false,
    uid: ''
  })

  const onDragEnd = (event: DragEndEvent) => {
    const { active } = event
    if (active?.id === 'draggable-draw-tool') {
      setBoxPoint({
        x: event.delta.x + boxPoint.x,
        y: event.delta.y + boxPoint.y
      })
    }

    if (active?.id === 'draggable-draw-setting') {

      setSettingPoint({
        x: event.delta.x + settingPoint.x,
        y: event.delta.y + settingPoint.y
      })
    }
  }

  useEffect(() => {
    return chartEvent.on('drawEnd', () => {
      setDrawSelect(undefined)
      setSetting(s => ({
        ...s,
        uid: ''
      }))
    })
  }, [setSetting])
  useEffect(() => {
    return chartEvent.on('drawStart', e => {
      setDrawSelect(e.type)
    })
  }, [])
  useEffect(() => {
    return chartEvent.on('drawCancel', () => {
      setDrawSelect(undefined)
    })
  }, [])
  useEffect(() => {
    return chartEvent.on('drawSelect', ({ type, e }) => {
      setDrawSelect(type)
      setSetting(s => ({
        ...s,
        color: e.overlay.extendData.color,
        width: e.overlay.extendData.lineWidth,
        type: e.overlay.extendData.lineType,
        lock: e.overlay.lock,
        uid: e.overlay.id
      }))
    })
  }, [setSetting])
  useEffect(() => {
    return chartEvent.on('drawDeSelect', () => {
      setDrawSelect(null)
      setSetting(s => ({
        ...s,
        uid: ''
      }))
    })
  })


  return (
    <DrawToolContext.Provider value={{ ...setting, setDrawSetting: setSetting }}>
      <DndContext onDragEnd={onDragEnd}>
        <DrawToolContainer pos={boxPoint}>
          <div className="border-b-primary border-0 w-full !border-dashed my-2.5" />
          <div className="">
            <DrawToolBar />
          </div>
          <div className="border-b-primary border-0 w-full !border-dashed my-2.5" />
          <div>
            <DrawToolAction />
          </div>
        </DrawToolContainer>
        {
          drawSelect ? (
            <DrawSettingBar pos={settingPoint} type={drawSelect} />
          ) : null
        }
      </DndContext>
    </DrawToolContext.Provider>
  )
}

const DrawToolContainer = ({ pos, children }: PropsWithChildren<{ pos: { x: number; y: number } }>) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'draggable-draw-tool'
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    position: 'absolute' as any,
    left: pos.x,
    top: pos.y
  }

  const onClose = () => {
    chartManage.showDrawTool(false)
  }

  return (
    <div ref={setNodeRef} className="bg-muted z-10 box-border p-2.5 rounded" style={style}>
      <div className="grid grid-cols-2 gap-2">
        <div
          {...listeners}
          {...attributes}
          className="text-tertiary hover:text-foreground hover:cursor-pointer flex items-center justify-center"
        >
          <JknIcon.Svg name="draggable" className="w-3 h-4" />
        </div>
        <div className="flex items-center justify-center" onClick={onClose} onKeyDown={() => void 0}>
          <JknIcon.Svg name="close" className="p-1 box-border" hoverable size={20} />
        </div>
      </div>
      {children}
    </div>
  )
}

const DrawSettingBar = ({ pos }: { pos: { x: number; y: number }, type: ChartOverlayType }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'draggable-draw-setting'
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    position: 'absolute' as any,
    left: pos.x,
    top: pos.y
  }

  const { setDrawSetting, ...setting } = useDrawTool()

  const _setSetting = (s: typeof setting) => {
    setDrawSetting(s as any)
    if (setting.uid) {
      chartEvent.get().emit('drawChange', {
        id: setting.uid,
        params: {
          color: s.color,
          lineWidth: s.width,
          lineType: s.type
        }
      })
    }
  }

  const _setLock = (l: boolean) => {
    _setSetting({ ...setting, lock: l })
    if (setting.uid) {
      chartEvent.get().emit('drawLock', {
        id: setting.uid!,
        lock: l
      })
    }
  }

  const _setDelete = () => {
    if (setting.uid) {
      chartEvent.get().emit('drawDelete', {
        id: setting.uid!
      })
      chartEvent.get().emit('drawDeSelect', {
        type: '' as any,
        e: {} as any
      })
    }
  }

  return (
    <div ref={setNodeRef} className="bg-muted z-10 box-border p-1 rounded flex items-center" style={style}>
      <div className="grid grid-cols-1 p-1 pr-2">
        <div
          {...listeners}
          {...attributes}
          className="text-tertiary hover:text-foreground hover:cursor-pointer flex items-center justify-center"
        >
          <JknIcon.Svg name="draggable" className="w-3 h-4" />
        </div>
      </div>
      <div className="flex items-center">
        <DrawSettingColorPicker color={setting.color} onChange={c => _setSetting({ ...setting, color: c })} />
        <DrawSettingLineWidthPicker width={setting.width} onChange={w => _setSetting({ ...setting, width: w })} />
        <DrawSettingLineTypePicker type={setting.type} onChange={t => _setSetting({ ...setting, type: t })} />
        <DrawSettingLockPicker lock={setting.lock} onChange={l => _setLock(l)} />
        <DrawSettingDeletePicker lock={setting.lock} onClick={() => _setDelete()} />
      </div>
    </div>
  )
}

const DrawToolBar = () => {
  const barStore = useChartManage(s => s.drawToolBar)
  const [active, setActive] = useState<Nullable<string>>()

  const drawBar = useMemo(() => {
    return barStore?.length ? barStore : defaultBar
  }, [barStore])

  const left = drawBar.slice(0, Math.ceil(drawBar.length / 2))
  const right = drawBar.slice(Math.ceil(drawBar.length / 2))

  useEffect(() => {
    return chartEvent.on('drawEnd', e => {
      if (e === active) {
        setActive('')
      }
    })
  }, [active])

  const { setDrawSetting, ...setting } = useDrawTool()
  const onClick = (item: ChartOverlayType) => {
    if (active === item) {
      chartEvent.get().emit('drawCancel', item)
      setActive('')
      return
    }

    if (active) {
      chartEvent.get().emit('drawCancel', item)
    }

    setActive(item)

    chartEvent.get().emit('drawStart', {
      type: item,
      params: {
        color: setting.color,
        lineWidth: setting.width,
        lineType: setting.type
      }
    })
  }

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {Array.from({ length: left.length }).map((_, index) => (
        <Fragment key={left[index].icon}>
          <div
            key={left[index].icon}
            className="hover:text-foreground hover:cursor-pointer data-[active=true]:text-primary"
            data-active={active === left[index].icon}
            onClick={() => onClick(left[index].icon as ChartOverlayType)}
            onKeyDown={() => { }}
          >
            <JknIcon.Svg
              name={`draw-${left[index].icon}` as any}
              size={20}
              className="p-1"
              hoverable
              label={left[index].label}
            />
          </div>
          {right[index] ? (
            <div
              key={right[index].icon}
              className="hover:text-foreground hover:cursor-pointer data-[active=true]:text-primary"
              data-active={active === right[index].icon}
              onClick={() => onClick(right[index].icon as ChartOverlayType)}
              onKeyDown={() => { }}
            >
              <JknIcon.Svg
                name={`draw-${right[index].icon}` as any}
                size={20}
                className="p-1"
                hoverable
                label={right[index].label}
              />
            </div>
          ) : null}
        </Fragment>
      ))}
      <div className="hover:text-foreground hover:cursor-pointer data-[active=true]:text-primary">
        <JknIcon.Svg name={'draw-more' as any} size={20} className="p-1" hoverable label="更多画线工具" />
      </div>
    </div>
  )
}

const DrawToolAction = () => {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <div className="hover:text-foreground hover:cursor-pointer">
        <JknIcon.Svg name="draw-visible" size={20} className="p-1" hoverable label="可见" />
      </div>
      <div className="hover:text-foreground hover:cursor-pointer">
        <JknIcon.Svg name="draw-lock" size={20} className="p-1" hoverable />
      </div>
      <div className="hover:text-foreground hover:cursor-pointer">
        <JknIcon.Svg name="draw-link" size={20} className="p-1" hoverable />
      </div>
      <div className="hover:text-foreground hover:cursor-pointer">
        <JknIcon.Svg name="draw-delete" size={20} className="p-1" hoverable />
      </div>
      <div className="hover:text-foreground hover:cursor-pointer">
        <JknIcon.Svg name="draw-continuous" size={20} className="p-1" hoverable />
      </div>
      <div className="hover:text-foreground hover:cursor-pointer">
        <JknIcon.Svg name="draw-statistics" size={20} className="p-1" hoverable />
      </div>
    </div>
  )
}


const DrawSettingColorPicker = ({ color, onChange }: { color: string; onChange: (newColor: string) => void }) => {

  return (
    <JknColorPickerPopover color={color} onChange={onChange}>
      <div className="hover:bg-accent px-2 h-full py-1 rounded cursor-pointer">
        <JknIcon.Svg name="edit" size={14} />
        <div className="h-0.5 w-full rounded" style={{ background: color }} />
      </div>
    </JknColorPickerPopover>
  )
}

const DrawSettingLineWidthPicker = ({ width, onChange }: { width: number; onChange: (newWidth: number) => void }) => {
  const lines = [1, 2, 3, 4, 5]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="h-full px-2 py-1 hover:bg-accent rounded cursor-pointer">
          <span className="flex items-center text-foreground">
            <span className="w-5 bg-foreground rounded" style={{ height: width }} />&nbsp;
            {width}px
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {
          lines.map(line => (
            <DropdownMenuItem key={line} data-checked={line === width} onClick={() => onChange(line)}
              className="text-foreground data-[checked=true]:text-accent"
            >
              <span className="flex items-center">
                <span className="w-5  bg-current rounded" style={{ height: line }} />&nbsp;
                {line}px
              </span>
            </DropdownMenuItem>
          ))
        }
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const DrawSettingLineTypePicker = ({ type, onChange }: { type: string; onChange: (newType: string) => void }) => {
  const types = ['solid', 'dashed', 'dotted']

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="h-full px-2 py-1 hover:bg-accent rounded cursor-pointer flex items-center">
          <span className="inline-block border-0 border-b border-foreground w-5" style={{ borderBottomStyle: type as any }} />
          &nbsp;
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {
          types.map(t => (
            <DropdownMenuItem key={t} data-checked={t === type} onClick={() => onChange(t)}
              className="text-foreground data-[checked=true]:text-accent"
            >
              <span className="flex border-0 border-b border-current w-5" style={{ borderBottomStyle: t as any }} />
              &nbsp;
              {{
                solid: '实线',
                dashed: '短虚线',
                dotted: '圆虚线'
              }[t] as any
              }
            </DropdownMenuItem>
          ))
        }
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const DrawSettingLockPicker = ({ lock, onChange }: { lock: boolean; onChange: (newLock: boolean) => void }) => {
  return (
    <div className="size-4 p-1.5 mx-1 hover:bg-accent rounded cursor-pointer data-[checked=true]:bg-primary" data-checked={lock} onClick={() => onChange(!lock)} onKeyDown={() => void 0}>
      <JknIcon.Svg name="draw-lock" className="w-full h-full" />
    </div>
  )
}

const DrawSettingDeletePicker = ({ onClick, lock }: { lock: boolean, onClick: () => void }) => {
  const _onClick = () => {
    if (!lock) {
      onClick()
      return
    }

    JknAlert.confirm({
      content: '画线为锁定状态，确定删除该画线？',
      onAction: async (ac) => {
        if (ac === 'confirm') {
          onClick()
        }
      }
    })
  }
  return (
    <div className="size-4 p-1.5 hover:bg-accent rounded cursor-pointer" onClick={_onClick} onKeyDown={() => void 0}>
      <JknIcon.Svg name="draw-delete" className="w-full h-full" />
    </div>
  )
}