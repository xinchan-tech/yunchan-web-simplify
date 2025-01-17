/**
 * 计算字符串宽度
 */
export function getStringWidth(str: string, font: string): number {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return 0
  context.font = font
  const metrics = context.measureText(str)
  return metrics.width
}