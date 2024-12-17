import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const cn = (...args: ClassValue[]) => twMerge(clsx(args))

export const colorUtil = {
  hexToRGB(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: Number.parseInt(result[1], 16),
      g: Number.parseInt(result[2], 16),
      b: Number.parseInt(result[3], 16)
    } : undefined
  },
  hexToRGBA(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: Number.parseInt(result[1], 16),
      g: Number.parseInt(result[2], 16),
      b: Number.parseInt(result[3], 16),
      a: Number.parseInt(result[4], 16) / 255
    } : undefined
  },
  argbToRGBA(argb: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(argb)
    return result ? {
      a: Number.parseInt(result[1], 16) / 255,
      r: Number.parseInt(result[2], 16),
      g: Number.parseInt(result[3], 16),
      b: Number.parseInt(result[4], 16)
    } : undefined
  },
  rgbaToString(rgba?: { r: number, g: number, b: number, a: number }) {
    if (!rgba) return ''
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`
  }
}