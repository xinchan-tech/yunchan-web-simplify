import { createBrowserRouter } from 'react-router'
import { routes } from './routes'
import { useUser } from '@/store'
import { appEvent } from '@/utils/event'

export const router = createBrowserRouter(routes)

export const routeWhiteList = ['/mall', '/']

router.subscribe(() => {
  const pathName = window.location.pathname
  const user = useUser.getState().user

  if (!user?.authorized.length) {
    if (!routeWhiteList.some(route => route === pathName)) {
      appEvent.emit('toast', { message: '暂无相关权限，请联系客服' })
      router.navigate('/')
    }
  }
})

export { routes }
