import { type ClassValue, clsx } from 'clsx'
import MD5 from 'crypto-js/md5'
import { twMerge } from 'tailwind-merge'

export const cn = (...args: ClassValue[]) => twMerge(clsx(args))

export declare namespace ColorType {
  export type HSB = {
    h: number
    s: number
    b: number
  }
  export type HSL = {
    h: number
    s: number
    l: number
  }
  export type RGB = {
    r: number
    g: number
    b: number
  }
  export type RGBA = {
    r: number
    g: number
    b: number
    a: number
  }
  export type HEX = string
}

export const colorUtil = {
  /**
   * 颜色盘
   */
  colorPalette: ['#ffd740', '#448aff', '#ff4081', '#7c4dff', '#18ffff', '#ff6e40'],
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
  hexToRGBA(hex: string, alpha?: number) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex)

    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
          a: alpha ?? Number.parseInt(result[4], 16) / 255 ?? 1
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
  rgbaToHex(rgba: ColorType.RGBA) {
    const r = Math.floor(rgba.r).toString(16).padStart(2, '0')
    const g = Math.floor(rgba.g).toString(16).padStart(2, '0')
    const b = Math.floor(rgba.b).toString(16).padStart(2, '0')
    const a = Math.floor(rgba.a * 255).toString(16).padStart(2, '0')
    return `#${r}${g}${b}${a}`.toUpperCase()
  },
  rgbaToString(rgba?: { r: number; g: number; b: number; a: number }) {
    if (!rgba) return ''
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`
  },
  hsbToHex(hsb: ColorType.HSB) {
    const rgb = this.hsbToRGB(hsb)
    if (!rgb) return ''
    return this.rgbToHex(rgb)
  },
  hsbToRGB(hsb: ColorType.HSB) {
    const { h, s, b:_b } = hsb
    const saturation = s / 100
    const brightness = _b / 100
    const chroma = brightness * saturation
    const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = brightness - chroma

    let r = 0
    let g = 0
    let b = 0
    if (h >= 0 && h < 60) {
      r = chroma
      g = x
      b = 0
    } else if (h >= 60 && h < 120) {
      r = x
      g = chroma
      b = 0
    } else if (h >= 120 && h < 180) {
      r = 0
      g = chroma
      b = x
    } else if (h >= 180 && h < 240) {
      r = 0
      g = x
      b = chroma
    } else if (h >= 240 && h < 300) {
      r = x
      g = 0
      b = chroma
    } else if (h >= 300 && h < 360) {
      r = chroma
      g = 0
      b = x
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    }
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
    const r = `#${Math.floor(rgb.r).toString(16).padStart(2, '0')}${Math.floor(rgb.g).toString(16).padStart(2, '0')}${Math.floor(rgb.b).toString(16).padStart(2, '0')}`.toUpperCase()
    return r
  },
  parseRGBA(rgba: string): ColorType.RGBA | undefined {
    /**
     * 判断rgba和hex
     */
    const hexResult = /^#?([a-f\d]{6}|[a-f\d]{8})$/i.exec(rgba)

    if (hexResult) {
      const hex = hexResult[1]
      const r = Number.parseInt(hex.slice(0, 2), 16)
      const g = Number.parseInt(hex.slice(2, 4), 16)
      const b = Number.parseInt(hex.slice(4, 6), 16)
      const a = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1
      return { r, g, b, a }
    }
    
    const result = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/i.exec(rgba)
    if (!result) return undefined
    return {
      r: Number(result[1]),
      g: Number(result[2]),
      b: Number(result[3]),
      a: result[4] ? Number(result[4]) : 1
    }
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
  },
  /**
   * 去除字符串中的 Unicode 字符
   * @param str 输入的字符串
   * @returns 去除 Unicode 字符后的字符串
   */
  removeUnicode: (str: string): string => {
    // biome-ignore lint/suspicious/noControlCharactersInRegex: <explanation>
    return str.replace(/[\u0000-\u001F\u007F-\uFFFF]/g, '')
  }
}
