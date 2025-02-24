import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import MD5 from 'crypto-js/md5'

export const cn = (...args: ClassValue[]) => twMerge(clsx(args))

export const colorUtil = {
  /**
   * 颜色盘
   */
  colorPalette: [
    '#FF6633',
    '#FFB399',
    '#FF33FF',
    '#FFFF99',
    '#00B3E6',
    '#E6B333',
    '#3366E6',
    '#999966',
    '#99FF99',
    '#B34D4D',
    '#80B300',
    '#809900',
    '#E6B3B3',
    '#6680B3',
    '#66991A',
    '#FF99E6',
    '#CCFF1A',
    '#FF1A66',
    '#E6331A',
    '#33FFCC'
  ],
  hexToRGB(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16)
        }
      : undefined
  },
  hexToRGBA(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
          a: Number.parseInt(result[4], 16) / 255
        }
      : undefined
  },
  argbToRGBA(argb: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(argb)
    return result
      ? {
          a: Number.parseInt(result[1], 16) / 255,
          r: Number.parseInt(result[2], 16),
          g: Number.parseInt(result[3], 16),
          b: Number.parseInt(result[4], 16)
        }
      : undefined
  },
  rgbaToString(rgba?: { r: number; g: number; b: number; a: number }) {
    if (!rgba) return ''
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`
  },
  hslToRGB(hsl: string) {
    const result = /^(\d+),\s*([\d.]+)%,\s*([\d.]+)%$/i.exec(hsl)
    if (!result) return undefined
    const h = Number(result[1]) / 360
    const s = Number(result[2]) / 100
    const l = Number(result[3]) / 100
    let r: number
    let g: number
    let b: number
    if (s === 0) {
      r = g = b = l
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        let tempT = t
        if (tempT < 0) tempT += 1
        if (tempT > 1) tempT -= 1
        if (tempT < 1 / 6) return p + (q - p) * 6 * tempT
        if (tempT < 1 / 2) return q
        if (tempT < 2 / 3) return p + (q - p) * (2 / 3 - tempT) * 6
        return p
      }
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
  },
  rgbToHex(rgb: { r: number; g: number; b: number }) {
    const r =  `#${Math.floor(rgb.r).toString(16)}${Math.floor(rgb.g).toString(16)}${Math.floor(rgb.b).toString(16)}`
    return r

  },
  radomColorForPalette() {
    return this.colorPalette[Math.floor(Math.random() * this.colorPalette.length)]
  },
  randomColor() {
    return ''
  },
  stringToColor(str: string, format?: 'rgba' | 'rgb' | 'hex') {
    const hash = MD5(str.trim()).toString()

    // 提取颜色值并强制不透明
    const rgbValue = Number.parseInt(hash.slice(0, 6), 16)
    const baseColor = 0xff000000 | rgbValue

    // RGB直接调暗（近似HSL亮度调整）
    const r = ((baseColor >> 16) & 0xff) * 0.5
    const g = ((baseColor >> 8) & 0xff) * 0.5
    const b = (baseColor & 0xff) * 0.5
  
    // 格式化为标准hex
    if (format === 'rgb') {
      return `rgb(${r}, ${g}, ${b})`
    }
    if (format === 'rgba') {
      return `rgba(${r}, ${g}, ${b}, 1)`
    }
    return colorUtil.rgbToHex({ r, g, b })
  }
}
