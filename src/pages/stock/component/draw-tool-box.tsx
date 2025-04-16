import { type ChartOverlayType, JknIcon } from '@/components'
import { DndContext, type DragEndEvent, useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Fragment, type PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { chartManage, useChartManage } from '../lib'
import { chartEvent } from '../lib/event'

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

export const DrawToolBox = () => {
  const [boxPoint, setBoxPoint] = useState({ x: 24, y: 240 })
  const [settingPoint, setSettingPoint] = useState({ x: 24, y: 24 })
  const [drawActive, setDrawActive] = useState<Nullable<ChartOverlayType>>()
  const [drawSelect, setDrawSelect] = useState<Nullable<ChartOverlayType>>()

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over?.id === 'draggable-draw-tool') {
      if (active.id !== over?.id) {
        setBoxPoint({
          x: event.delta.x + boxPoint.x,
          y: event.delta.y + boxPoint.y
        })
      }
    }

    if (over?.id === 'draggable-draw-setting') {
      if (active.id !== over?.id) {
        setSettingPoint({
          x: event.delta.x + settingPoint.x,
          y: event.delta.y + settingPoint.y
        })
      }
    }
  }

  useEffect(() => {
    return chartEvent.on('drawEnd', () => {
      setDrawActive(undefined)
    })
  }, [])
  useEffect(() => {
    return chartEvent.on('drawStart', e => {
      setDrawActive(e)
    })
  }, [])
  useEffect(() => {
    return chartEvent.on('drawCancel', () => {
      setDrawSelect(undefined)
    })
  }, [])
  useEffect(() => {
    return chartEvent.on('drawSelect', e => {
      setDrawSelect(e)
    })
  }, [])

  console.log(drawActive)
  return (
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
        drawActive || drawSelect ? (
          <DrawSettingBar pos={settingPoint} type={drawSelect! || drawActive!} />
        ): null
      }
    </DndContext>
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

const DrawSettingBar = ({ pos, type }: { pos: { x: number; y: number }, type: ChartOverlayType }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'draggable-draw-setting'
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    position: 'absolute' as any,
    left: pos.x,
    top: pos.y
  }

  return (
    <div ref={setNodeRef} className="bg-muted z-10 box-border p-2.5 rounded flex items-center" style={style}>
      <div className="grid grid-cols-2 gap-2">
        <div
          {...listeners}
          {...attributes}
          className="text-tertiary hover:text-foreground hover:cursor-pointer flex items-center justify-center"
        >
          <JknIcon.Svg name="draggable" className="w-3 h-4" />
        </div>
      </div>
      <div>
        
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

    chartEvent.get().emit('drawStart', item)
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
            onKeyDown={() => {}}
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
              onKeyDown={() => {}}
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
      {/* <div className="grid grid-cols-1 gap-2.5">
        {left.map((item) => (
          <div key={item.icon} className="hover:text-foreground hover:cursor-pointer data-[active=true]:text-primary" data-active={active === item.icon} onClick={() => onClick(item.icon as ChartOverlayType)} onKeyDown={() => { }}>
            <JknIcon.Svg name={`draw-${item.icon}` as any} size={20} className="p-1" hoverable label={item.label} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        {
          right.map((item) => (
            <div key={item.icon} className="hover:text-foreground hover:cursor-pointer data-[active=true]:text-primary" data-active={active === item.icon} onClick={() => onClick(item.icon as ChartOverlayType)} onKeyDown={() => { }}>
              <JknIcon.Svg name={`draw-${item.icon}` as any} size={20} className="p-1" hoverable label={item.label} />
            </div>
          ))
        }
      </div> */}
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
