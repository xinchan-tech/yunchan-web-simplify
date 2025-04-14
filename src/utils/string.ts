import aes from 'crypto-js/aes'
import encUtf8 from 'crypto-js/enc-utf8'
import pako from 'pako'

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

export class AESCrypt {
  private static key: string = import.meta.env.PUBLIC_BASE_AES_KEY
  private static iv: string = import.meta.env.PUBLIC_BASE_AES_IV

  get key(): string {
    throw new Error('Key is not defined')
  }

  static encrypt(data: string): string {
    try {
      const encrypted = aes.encrypt(data, encUtf8.parse(AESCrypt.key), {
        iv: encUtf8.parse(AESCrypt.iv)
      })
      return encrypted.toString()
    } catch (error) {
      console.error('Encryption error:', error)
      throw error
    }
  }

  static decrypt(data: string): string {
    try {
      const decrypted = aes.decrypt(data, encUtf8.parse(AESCrypt.key), {
        iv: encUtf8.parse(AESCrypt.iv)
      })
      return decrypted.toString(encUtf8)
    } catch (error) {
      console.error('Decryption error:', error)
      throw error
    }
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

export const stringToUint8Array = (str: string): Uint8Array => {
  const newStr = unescape(encodeURIComponent(str))
  const arr = []
  for (let i = 0, j = newStr.length; i < j; ++i) {
    arr.push(newStr.charCodeAt(i))
  }
  const tmpUint8Array = new Uint8Array(arr)
  return tmpUint8Array
}
