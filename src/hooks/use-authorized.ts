import { router } from '@/router'
import { type UserPermission, useUser } from '@/store'
import { appEvent } from '@/utils/event'
import { useCallback } from 'react'
import { useToast } from './use-toast'

type Authorized = keyof UserPermission

const DEFAULT_TOAST = '暂无相关权限，请联系客服'
const MAX_PICKER_TIME_TOAST = '升级会员，可同时选择更多周期'
const STOCK_PICKER_GROUP_TOAST = '升级 VIP 获取更多权限'
const STOCK_POOL_MAX_TOAST = '升级 VIP 获取更多权限'

let globalRedirectTimer: number

export const useAuthorized = <T extends Authorized>(
  key?: T
): [() => UserPermission[T] | undefined, (message?: string, redirect?: boolean) => void] => {
  const permission = useUser(state => state.user?.permission)
  const authPermission = useCallback((): UserPermission[T] | undefined => {
    if (!permission) return
    if (!key) return
    return permission[key]
  }, [key, permission])

  const toastNotAuth = useCallback(
    (message?: string, _redirect?: boolean) => {
      let msg = message
      if (!msg) {
        switch (key) {
          case 'stockPickMaxTime':
            msg = MAX_PICKER_TIME_TOAST
            break
          case 'stockPickGroup':
            msg = STOCK_PICKER_GROUP_TOAST
            break
          case 'stockPoolNum':
            msg = STOCK_POOL_MAX_TOAST
            break
          default:
            msg = DEFAULT_TOAST
            break
        }
      }

      appEvent.emit('notAuth')
      // if (redirect) {
      //   if (globalRedirectTimer) {
      //     clearTimeout(globalRedirectTimer)
      //   }
      //   globalRedirectTimer = window.setTimeout(() => {
      //     router.navigate('/app/mall')
      //   }, 3000)
      // }
    },
    [key]
  )

  return [authPermission, toastNotAuth]
}
