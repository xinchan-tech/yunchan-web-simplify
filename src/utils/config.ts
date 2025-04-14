type OS = 'windows' | 'mac' | 'ios' | 'android' | 'other'

const os: OS = (() => {
  return /windows|win32/i.test(navigator.userAgent)
    ? 'windows'
    : /macintosh|mac os x/i.test(navigator.userAgent)
      ? 'mac'
      : /iphone|ipad/i.test(navigator.userAgent)
        ? 'ios'
        : /android/i.test(navigator.userAgent)
          ? 'android'
          : 'other'
})()

export const sysConfig = {
  PUBLIC_BASE_API_URL: import.meta.env.PUBLIC_BASE_API_URL,
  PUBLIC_BASE_WS_URL: import.meta.env.PUBLIC_BASE_WS_URL,
  PUBLIC_BASE_WS_URL_V2: import.meta.env.PUBLIC_BASE_WS_URL_V2,
  PUBLIC_BASE_WS_STOCK_URL: import.meta.env.PUBLIC_BASE_WS_STOCK_URL,
  PUBLIC_BASE_ICON_URL: import.meta.env.PUBLIC_BASE_ICON_URL,
  PUBLIC_BASE_GOOGLE_CLIENT_ID: import.meta.env.PUBLIC_BASE_GOOGLE_CLIENT_ID,
  PUBLIC_BASE_APPLE_REDIRECT_URI: import.meta.env.PUBLIC_BASE_APPLE_REDIRECT_URI,
  PUBLIC_BASE_AES_KEY: import.meta.env.PUBLIC_BASE_AES_KEY,
  PUBLIC_BASE_AES_IV: import.meta.env.PUBLIC_BASE_AES_IV,
  PUBLIC_BASE_OSS_ACCESSKEYID: import.meta.env.PUBLIC_BASE_OSS_ACCESSKEYID,
  PUBLIC_BASE_OSS_ACCESS_KEY_SECRET: import.meta.env.PUBLIC_BASE_OSS_ACCESS_KEY_SECRET,
  PUBLIC_BASE_BUILD_ENV: import.meta.env.PUBLIC_BASE_BUILD_ENV,
  OS: os
}
window._sysConfig = sysConfig