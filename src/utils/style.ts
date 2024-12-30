import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...args: ClassValue[]) => twMerge(clsx(args))

export const colorUtil = {
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
  }
}
