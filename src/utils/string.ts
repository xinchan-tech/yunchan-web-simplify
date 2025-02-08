import pako from 'pako'
import aes from 'crypto-js/aes'
import encUtf8 from 'crypto-js/enc-utf8'

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

/**
 * gzDecode
 */
export const gzDecode = (str: string): string => {
  const data = atob(str as unknown as string)

  const dataUint8 = new Uint8Array(data.length)

  for (let i = 0; i < data.length; i++) {
    dataUint8[i] = data.charCodeAt(i)
  }

  return pako.inflate(dataUint8, { to: 'string' })
}

/**
 * aesDecrypt
 */
export const aesDecrypt = (str: string): string => {
  try {
    const key = import.meta.env.PUBLIC_BASE_AES_KEY
    const iv = import.meta.env.PUBLIC_BASE_AES_IV
    const decryptedData = aes.decrypt(str, encUtf8.parse(key), {
      iv: encUtf8.parse(iv)
    })
    return decryptedData.toString(encUtf8)
  } catch (e) {
    console.error(
      'AES decrypt error:',
      e,
      'key:',
      import.meta.env.PUBLIC_BASE_AES_KEY,
      'iv:',
      import.meta.env.PUBLIC_BASE_AES_IV,
      'str:',
      str
    )
    throw e
  }
}

export const base64Decode = (str: string): string => {
  try {
    return atob(str)
  } catch (e) {
    console.error('Base64 decode error:', e)
    throw e
  }
}
