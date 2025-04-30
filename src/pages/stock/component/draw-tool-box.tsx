import { getUserPlotting } from "@/api"
import { Button, type ChartOverlayType, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, JknAlert, JknColorPickerPopover, JknIcon, JknRcTable, type JknRcTableProps, Popover, PopoverContent, PopoverTrigger, useModal, withTooltip } from '@/components'
import { useCheckboxGroup } from "@/hooks"
import { dateUtils } from "@/utils/date"
import { stockUtils } from "@/utils/stock"
import { DndContext, type DragEndEvent, useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { type Updater, useImmer } from "use-immer"
import { useChartManage } from '../lib'
import { chartEvent } from '../lib/event'

const defaultBar: {
  icon: ChartOverlayType
  label: string
  tool?: string[]
  config?: {
    color: string
  }
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
    },
    {
      icon: 'firewall',
      label: '防火墙'
    },
    {
      icon: 'pressure-line',
      label: '压力线',
      config: {
        color: '#9A26AE'
      }
    },
    {
      icon: 'support-line',
      label: '支撑线',
      config: {
        color: '#2495F1'
      }
    },
    {
      icon: 'pen',
      label: '画笔'
    }
  ]

const DrawToolContext = createContext<{
  color: string,
  width: number,
  type: string,
  lock: boolean,
  uid: Nullable<string>
  /**
   * 是否连续画线
   */
  continuous?: boolean
  /**
   * 跨周期画线
   */
  cross?: boolean
  setDrawSetting: Updater<{
    color: string
    width: number
    type: string
    lock: boolean
    uid: string
    continuous: boolean
    cross: boolean
  }>
}>({} as any)

const useDrawTool = () => useContext(DrawToolContext)

export const DrawToolBox = () => {
  const [boxPoint, setBoxPoint] = useState({ x: 24, y: 240 })
  const [settingPoint, setSettingPoint] = useState({ x: 24, y: 24 })
  const [drawSelect, setDrawSelect] = useState<Nullable<ChartOverlayType>>()
  const [setting, setSetting] = useImmer({
    color: 'rgba(255, 215, 0)',
    width: 2,
    type: 'solid',
    lock: false,
    uid: '',
    cross: false,
    continuous: false
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

  // useEffect(() => {
  //   return chartEvent.on('drawEnd', () => {
  //     setDrawSelect(undefined)
  //     setSetting(s => ({
  //       ...s,
  //       uid: ''
  //     }))
  //   })
  // }, [setSetting])
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
  }, [setSetting])

  const drawTool = useChartManage(s => s.drawTool)
  return (
    <DrawToolContext.Provider value={{ ...setting, setDrawSetting: setSetting }}>
      <DndContext onDragEnd={onDragEnd}>
        {
          drawTool ? (
            <div className="bg-background border-l-primary px-1.5 pt-2.5">
              <div className="">
                <DrawToolBar />
              </div>
              <div className="border-0 border-b w-full !border-dashed my-2.5 !border-b-foreground" />
              <div>
                <DrawToolAction />
              </div>
            </div>
          ) : null
        }
        {
          drawSelect ? (
            <DrawSettingBar pos={settingPoint} type={drawSelect} />
          ) : null
        }
      </DndContext>
    </DrawToolContext.Provider>
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
          lineType: s.type,
          cross: s.cross ?? false
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
    <div ref={setNodeRef} className="bg-accent z-10 box-border p-1 rounded flex items-center" style={style}>
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
        <DrawSettingColorPicker color={setting.color} onChange={c => _setSetting({ ...setting, color: c })} label="颜色选择" side="bottom" sideOffset={4} />
        <DrawSettingLineWidthPicker width={setting.width} onChange={w => _setSetting({ ...setting, width: w })} label="画线宽度" side="bottom" sideOffset={4}  />
        <DrawSettingLineTypePicker type={setting.type} onChange={t => _setSetting({ ...setting, type: t })} label="画线类型" side="bottom" sideOffset={4} />
        <DrawSettingLockPicker lock={setting.lock} onChange={l => _setLock(l)} label="锁定画线" side="bottom" sideOffset={4}  />
        <DrawSettingDeletePicker lock={setting.lock} onClick={() => _setDelete()} label="删除画线" side="bottom" sideOffset={4}  />
      </div>
    </div>
  )
}

const DrawToolBar = () => {
  const barStore = useChartManage(s => s.drawToolBar)
  const [active, setActive] = useState<Nullable<{ type: string, uid: string }>>()

  const drawBar = useMemo(() => {
    return barStore?.length ? barStore : defaultBar
  }, [barStore])

  const { setDrawSetting, ...setting } = useDrawTool()

  useEffect(() => {
    return chartEvent.on('drawEnd', ({ type }) => {
      setActive(undefined)

      if (setting.continuous) {
        chartEvent.get().emit('drawStart', {
          type: type,
          params: {
            color: defaultBar.find(item => item.icon === type)?.config?.color ?? setting.color,
            lineWidth: setting.width,
            lineType: setting.type,
            cross: setting.cross ?? false
          }
        })
      }
    })
  }, [setting.type, setting.width, setting.color, setting.continuous, setting.cross])



  const onClick = (item: ChartOverlayType) => {
    if (active?.type === item) {
      // chartEvent.get().emit('drawCancel', active.uid)
      setActive(undefined)
      return
    }

    if (active) {
      // chartEvent.get().emit('drawCancel', active.uid)
    }

    setActive({ type: item, uid: undefined as any })

    chartEvent.get().emit('drawStart', {
      type: item,
      params: {
        color: defaultBar.find(v => v.icon === item)?.config?.color ?? setting.color,
        lineWidth: setting.width,
        lineType: setting.type,
        cross: setting.cross ?? false
      }
    })
  }

  return (
    <div className="grid grid-cols-1 gap-2.5">
      {
        drawBar.map(item => (
          <div
            key={item.icon}
            className="hover:text-foreground hover:cursor-pointer data-[active=true]:text-primary"
            data-active={active?.type === item.icon}
            onClick={() => onClick(item.icon as ChartOverlayType)}
            onKeyDown={() => { }}
          >
            <JknIcon.Svg
              name={`draw-${item.icon}` as any}
              size={20}
              className="p-1"
              hoverable
              labelSide="right"
              label={item.label}
            />
          </div>
        ))
      }
      <div className="hover:text-foreground hover:cursor-pointer data-[active=true]:text-primary">
        <JknIcon.Svg name={'draw-more' as any} size={20} className="p-1" hoverable label="更多画线工具" labelSide="right" />
      </div>
    </div>
  )
}

const DrawToolAction = () => {
  const [visible, setVisible] = useState(true)

  const onSetVisible = () => {
    chartEvent.get().emit('drawHide', !visible)
    setVisible(!visible)
  }

  const { continuous, cross, setDrawSetting } = useDrawTool()

  const onSetContinuous = () => {
    setDrawSetting(s => ({
      ...s,
      continuous: !s.continuous
    }))
  }

  const onDelete = () => {
    JknAlert.confirm({
      content: '确定清除所有画线？',
      onAction: async (ac) => {
        if (ac === 'confirm') {
          chartEvent.get().emit('drawDelete', {
            id: undefined
          })
          setDrawSetting(s => ({
            ...s,
            uid: ''
          }))
        }
      },
      okBtnVariant: 'destructive'
    })
  }

  const onSetCross = () => {
    setDrawSetting(s => ({
      ...s,
      cross: !s.cross
    }))
  }

  const statistics = useModal({
    content: <DrawStatisticsTable />,
    title: '画线统计',
    className: 'w-[860px]',
    closeIcon: true,
    footer: null
  })

  return (
    <div className="grid grid-cols-1 gap-2.5">
      <div data-checked={!visible} className="hover:text-foreground hover:cursor-pointer data-[checked=true]:text-primary" onClick={() => onSetVisible()} onKeyDown={() => void 0}>
        <JknIcon.Svg name="invisible" size={20} className="p-1" hoverable label="显示" labelSide="right" />
      </div>
      <div data-checked={cross} className="hover:text-foreground hover:cursor-pointer data-[checked=true]:text-primary" onClick={() => onSetCross()} onKeyDown={() => void 0}>
        <JknIcon.Svg name="draw-link" size={20} className="p-1" hoverable label="跨周期绘制" labelSide="right" />
      </div>
      <div className="hover:text-foreground hover:cursor-pointer" onClick={() => onDelete()} onKeyDown={() => void 0}>
        <JknIcon.Svg name="draw-delete" size={20} className="p-1" hoverable label="清除所有" labelSide="right" />
      </div>
      <div data-checked={continuous} className="hover:text-foreground hover:cursor-pointer data-[checked=true]:text-primary" onClick={() => onSetContinuous()} onKeyDown={() => void 0}>
        <JknIcon.Svg name="draw-continuous" size={20} className="p-1" hoverable label="连续绘制" labelSide="right" />
      </div>
      <div className="hover:text-foreground hover:cursor-pointer data-[checked=true]:text-primary" onClick={() => statistics.modal.open()} onKeyDown={() => void 0}>
        <JknIcon.Svg name="draw-statistics" size={20} className="p-1" hoverable label="绘制统计" labelSide="right" />
      </div>
      {
        statistics.context
      }
    </div>
  )
}


const DrawSettingColorPicker = withTooltip(({ color, onChange }: { color: string; onChange: (newColor: string) => void }) => {

  return (
    <JknColorPickerPopover color={color} onChange={onChange}>
      <div className="hover:bg-accent px-2 h-full py-1 rounded cursor-pointer">
        <JknIcon.Svg name="edit" size={14} />
        <div className="h-0.5 w-full rounded" style={{ background: color }} />
      </div>
    </JknColorPickerPopover>
  )
})

const DrawSettingLineWidthPicker = withTooltip(({ width, onChange }: { width: number; onChange: (newWidth: number) => void }) => {
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
)
const DrawSettingLineTypePicker = withTooltip(({ type, onChange }: { type: string; onChange: (newType: string) => void }) => {
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
})

const DrawSettingLockPicker = withTooltip(({ lock, onChange }: { lock: boolean; onChange: (newLock: boolean) => void }) => {
  return (
    <div className="size-4 p-1.5 mx-1 hover:bg-accent rounded cursor-pointer data-[checked=true]:bg-primary" data-checked={lock} onClick={() => onChange(!lock)} onKeyDown={() => void 0}>
      <JknIcon.Svg name="draw-lock" className="w-full h-full" />
    </div>
  )
})

const DrawSettingDeletePicker = withTooltip(({ onClick, lock }: { lock: boolean, onClick: () => void }) => {
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
})

const DrawStatisticsTable = () => {
  const draws = useQuery({
    queryKey: [getUserPlotting],
    queryFn: () => getUserPlotting(),
  })

  const queryClient = useQueryClient()

  const onDelete = (id: string) => {
    JknAlert.confirm({
      content: '确定删除该画线？',
      onAction: async (ac) => {
        if (ac === 'confirm') {
          chartEvent.get().emit('drawDelete', {
            id
          })
          queryClient.setQueryData([getUserPlotting], (old: any) => {
            return old.filter((item: any) => item.hash !== id)
          })
        }
      }
    })
  }

  const deleteAll = () => {
    JknAlert.confirm({
      content: '确定删除所有画线？',
      onAction: async (ac) => {
        if (ac === 'confirm') {
          chartEvent.get().emit('drawDelete', {
            id: checked
          })
          queryClient.setQueryData([getUserPlotting], (old: any) => {
            return old.filter((item: any) => !checked.includes(item.hash))
          })

          setCheckedAll([])
        }
      }
    })
  }

  const { checked, toggle, setCheckedAll } = useCheckboxGroup([])

  const columns: JknRcTableProps<ArrayItem<typeof draws.data>>['columns'] = [
    {
      title: '序号',
      dataIndex: 'id',
      align: 'center',
      width: 60,
      render: (_, __, index) => <span>{index + 1}</span>
    },
    {
      title: '股票代码',
      dataIndex: 'symbol',
      align: 'center',
      render: (_, record) => <span>{record.symbol}</span>
    },
    {
      title: '股票周期',
      dataIndex: 'stock_kline_id',
      align: 'center',
      render: (_, record) => <span>{stockUtils.intervalToStr(+record.stock_kline_value)}</span>
    },
    {
      title: '类型',
      dataIndex: 'plotting',
      align: 'center',
      render: (_, record) => <span>{record.plotting}</span>
    },
    {
      title: '锚点日期',
      width: 180,
      dataIndex: 'anchor_date',
      render: (_, record) => <span>{record.points[0].x.split('@').shift()}</span>
    },
    {
      title: '创建时间',
      width: 180,
      dataIndex: 'create_time',
      render: (_, record) => <span>{dateUtils.toUsDay(+record.create_time).format('YYYY-MM-DD HH:mm:00')}</span>
    },
    {
      title: '操作',
      dataIndex: 'delete',
      align: 'center',
      width: 60,
      render: (_, record) => (
        <JknIcon.Svg name="delete" className="w-4 h-4 p-1.5 cursor-pointer" hoverable onClick={() => onDelete(record.hash)} />
      )
    },
    {
      title: (
        <Popover open={checked.length > 0} >
          <PopoverTrigger asChild>
            <div>
              <JknIcon.Checkbox className="rounded-none" checkedIcon="checkbox_mult_sel" uncheckedIcon="checkbox_mult_nor" checked={checked.length > 0} onClick={() => setCheckedAll(!checked.length ? (draws.data?.map(v => v.hash) ?? []) : [])} />
            </div>
          </PopoverTrigger>
          <PopoverContent className="text-center p-2 w-fit">
            <Button variant="destructive" className="w-24" onClick={deleteAll}>删除</Button>
          </PopoverContent>
        </Popover>
      ),
      dataIndex: 'checkbox',
      align: 'center',
      width: 60,
      render: (_, record) => (
        <JknIcon.Checkbox className="rounded-none" checkedIcon="checkbox_mult_sel" uncheckedIcon="checkbox_mult_nor" checked={checked.includes(record.hash)} onClick={() => toggle(record.hash)} />
      )
    }
  ]

  return (
    <div className="h-[640px]">
      <JknRcTable
        columns={columns}
        data={draws.data}
        rowKey="hash"
      />
    </div>
  )
}