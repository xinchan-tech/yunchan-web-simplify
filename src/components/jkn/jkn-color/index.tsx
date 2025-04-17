import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { type ColorType, colorUtil } from '@/utils/style'
import { useUpdateEffect } from "ahooks"
import { type PropsWithChildren, useRef } from 'react'
import { useImmer } from "use-immer"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { JknIcon } from "../jkn-icon"
import { colorPalette } from './color'

interface ColorStore {
  color: string[]
}

const useColorStore = create<ColorStore>()(persist(
  () => ({
    color: [] as string[]
  }),
  {
    name: "color-picker", // unique name
    storage: createJSONStorage(() => localStorage)
  }
))

const saveFavColor = (color: string) => {
  const colors = useColorStore.getState().color

  if (colors.some(c => c === color)) return

  useColorStore.setState((state) => {
    const colors = state.color

    if (colors.length >= 8) {
      colors.shift()
    }
    colors.push(color)
    return {
      color: [...colors]
    }
  })
}

interface JknColorPickerProps {
  color?: ColorType.HEX
  onChange?: (color: ColorType.HEX) => void
}

export const JknColorPickerPopover = ({ children, ...props }: PropsWithChildren<JknColorPickerProps>) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="p-5">
        <JknColorPicker {...props} />
      </PopoverContent>
    </Popover>
  )
}

// const getFavColor = (key: string) => {
//   return useColorStore.getState().color.find(c => c === key)
// }

export const JknColorPicker = (props: JknColorPickerProps) => {
  const [color, setColor] = useImmer({ color: props.color ?? '#ffffff', alpha: 1 })


  const onColorChange = (c: ColorType.HEX) => {
    setColor(draft => {
      draft.color = c
    })
  }

  const onAlphaChange = (alpha: number) => {
    setColor(draft => {
      draft.alpha = alpha
    })
  }

  const onFavPicker = (color: ColorType.RGBA) => {
    setColor(draft => {
      draft.color = colorUtil.rgbToHex(color)
      draft.alpha = color.a
    })
  }

  useUpdateEffect(() => {
    props.onChange?.(colorUtil.rgbaToString(colorUtil.hexToRGBA(color.color, color.alpha)))
  }, [color])


  return (
    <div className="space-y-4">
      <HexColorPicker color={color.color} onChange={onColorChange} />
      <AlphaColorPicker color={color.color} alpha={color.alpha} onChange={onAlphaChange} />
      <ColorFav color={colorUtil.hexToRGBA(color.color, color.alpha)} onChange={onFavPicker} />
    </div>
  )
}

interface HexColorPickerProps {
  color?: ColorType.HEX
  onChange?: (color: ColorType.HEX) => void
}

const HexColorPicker = (props: HexColorPickerProps) => {
  const colors = useRef<ColorType.HEX[][]>(colorPalette)
  const transformColor = (color: ColorType.HEX[][]) => {
    const result: ColorType.HEX[] = []
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < color.length; j++) {
        result.push(color[j][i])
      }
    }
    return result
  }

  return (
    <div className="grid rounded overflow-hidden" style={{ gridTemplateColumns: `repeat(${colors.current.length}, 1fr)` }}>
      {transformColor(colors.current).reverse().map(color => {
        return (
          <div
            key={color}
            data-active={color === props.color}
            className="flex items-center gap-2 border-2 border-solid hover:!border-white cursor-pointer data-[active=true]:!border-white"
            style={{ borderColor: color }}
            onClick={() => props.onChange?.(color)}
            onKeyDown={() => void 0}
          >
            <div className="size-5" style={{ backgroundColor: color }} />
          </div>
        )
      })}
    </div>
  )
}

/**
 * 透明度选择
 */
interface AlphaColorPickerProps {
  color: ColorType.HEX
  alpha?: number
  onChange?: (alpha: number) => void
}
const AlphaColorPicker = (props: AlphaColorPickerProps) => {
  return (
    <div className="inline-flex items-center gap-2 w-full">
      <Slider className="color-picker-slider flex-1" value={props.alpha ? [props.alpha * 100] : [100]} onValueChange={v => props.onChange?.(v[0] / 100)} />
      <span className="w-12">{((props.alpha ?? 1) * 100).toFixed(0)}%</span>
      <style jsx>{`
        :global(.slider-track) {
          height: 20px;
          background: linear-gradient(to right, ${colorUtil.rgbaToString(colorUtil.hexToRGBA(props.color, 0))} 0%, ${props.color} 100%);
        }

        :global(.slicer-thumb){
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: ${colorUtil.rgbaToString(colorUtil.hexToRGBA(props.color, props.alpha ?? 1))};
          border: 2px solid #fff;

        }

        :global(.slider-range){
          display: none;
        }
      `}</style>
    </div>
  )
}

/**
 * 收藏的颜色
 */
interface ColorFavProps {
  color?: ColorType.RGBA
  onChange?: (color: ColorType.RGBA) => void
}

const ColorFav = (props: ColorFavProps) => {
  const colors = useColorStore(s => s.color)

  const onFavColor = () => {
    if (!props.color) return
    saveFavColor(colorUtil.rgbaToString(props.color))
  }

  const getColor = (color: string) => {
    const r = colorUtil.parseRGBA(color)

    if (!r) return

    return props.onChange?.(r)
  }

  const onRemoveColor = () => {
    if (!props.color) return
    useColorStore.setState((state) => {
      const colors = state.color.filter(c => c !== colorUtil.rgbaToString(props.color))
      return {
        color: [...colors]
      }
    })
  }

  return (
    <div className="flex items-center overflow-hidden space-x-2" style={{ gridTemplateColumns: `repeat(${colors.length + 1}, 1fr)` }}>
      {colors.map(color => {
        return (
          <div
            key={color}
            data-active={color === colorUtil.rgbaToString(props.color)}
            className="size-6 rounded-full border border-solid border-transparent data-[active=true]:border-white relative"
            style={{ backgroundColor: color }}
            onClick={() => getColor(color)}
            onKeyDown={() => void 0}
          />
        )
      })}
      <div className="size-6 border-solid border-1 border-accent bg-accent rounded-full text-center cursor-pointer leading-6" onClick={onFavColor} onKeyDown={() => { }}>
        <JknIcon.Svg name="plus" size={12} />
      </div>
      {
        colors.some(c => c === colorUtil.rgbaToString(props.color)) ? (
          <div className="size-6 border-solid border-1 border-accent bg-accent rounded-full text-center cursor-pointer leading-6" onClick={onRemoveColor} onKeyDown={() => { }}>
            <JknIcon.Svg name="delete" size={12} />
          </div>
        ) : null
      }
    </div>
  )
}
