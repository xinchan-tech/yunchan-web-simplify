import { createBrowserRouter } from 'react-router'
import { routes } from './routes'
import { useUser } from '@/store'
import { appEvent } from '@/utils/event'

export const router = createBrowserRouter(routes)

export const routeWhiteList = ['/mall', '/', '/login', '/home', '/home/features', '/home/cookies']

router.subscribe(() => {
  const pathName = window.location.pathname
  const user = useUser.getState().user
  if (!user?.authorized.length) {
    if(pathName.startsWith('/home')){
      return
    }
    if (!routeWhiteList.some(route => route === pathName)) {
      appEvent.emit('toast', { message: '暂无相关权限，请联系客服' })
      router.navigate('/')
    }
  }
})

export { routes }
