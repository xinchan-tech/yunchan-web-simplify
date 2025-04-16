import { colorUtil, type ColorType } from "@/utils/style"
import { useRef } from "react"

export const JknColorPicker = () => {
  return (
    <HSBColorPicker />
  )
}

const HSBColorPicker = () => {
  const colors = useRef<ColorType.HSB[][]>(getColorsByHSB())

  return (
    <div>
      {
        colors.current.flat().map((color) => {
          const c = colorUtil.hsbToHex(color)

          return (
            <div key={c} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
              <span>{`h: ${color.h}, s: ${color.s}, b: ${color.b}`}</span>
            </div>
          )
        })
      }
    </div>
  )
}

const getColorsByHSB = () => {
  const colors: ColorType.HSB[][] = []
  const totalStep = 9
  const minPercent = 20
  const maxPercent = 75
  const step = (maxPercent - minPercent) / totalStep
  for (let hue = 0; hue < 360; hue += 30) { // Divide hue into 12 groups (360 / 30 = 12)
    const group: ColorType.HSB[] = []
    for(let s = minPercent; s <= maxPercent; s += step) {
      group.push({
        h: hue,
        s: Math.round(s),
        b: Math.round(100 - s)
      })
    }
    colors.push(group)
  }
  return colors
}