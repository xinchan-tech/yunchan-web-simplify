import { router } from "@/router"
import { useToken } from "@/store"


export const navWithAuth = (...args: Parameters<typeof router.navigate>) => {
  const token = useToken.getState().token
  if(!token) {
    message.error('请先登录账号或联系客服')
    return
  }

  return router.navigate(...args)
}