import { useToken, useUser } from '@/store'
import { appEvent } from '@/utils/event'
import { type PropsWithChildren, useEffect, useRef } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { JknAlert } from '../jkn/jkn-alert'
import { MallPackages } from '../mall-dialog'
import { useModal } from '../modal'

export const routeWhiteList = ['/app/mall', '/app', '/app/login']

export const AuthGuard = (props: PropsWithChildren) => {
  const location = useLocation()
  const token = useToken(s => s.token)
  const authorized = useUser(s => s.user?.authorized)
  const lastPath = useRef('/app')
  const navigate = useNavigate()
  const showLogin = useRef(false)

  useEffect(() => {
    const handler = () => {
      useToken.getState().removeToken()
      useUser.getState().reset()

      if (!showLogin.current && window.location.pathname !== '/app') {
        showLogin.current = true
        JknAlert.info({
          content: '请先登录账号',
          onAction: async () => {
            showLogin.current = false
            window.location.href = '/app'
          }
        })
      }
    }
    appEvent.on('logout', handler)

    return () => {
      appEvent.off('logout', handler)
    }
  }, [])

  const mall = useModal({
    content: (
      <MallPackages
        showMore={() => {
          /* Add your show more logic here */
        }}
      />
    ),
    footer: null,
    className: 'w-[878px]'
  })

  useEffect(() => {
    const handler = () => {
      mall.modal.open()
    }

    appEvent.on('notAuth', handler)
    return () => {
      appEvent.off('notAuth', handler)
    }
  }, [mall.modal])

  if (!routeWhiteList.some(route => route === location.pathname)) {
    if (!token) {
      if (!showLogin.current) {
        showLogin.current = true
        JknAlert.info({
          content: '请先登录账号',
          onAction: async e => {
            showLogin.current = false
            if (e === 'confirm') {
              navigate(`/app/login?redirect=${encodeURIComponent(location.pathname + location.search)}`, {
                replace: true
              })
              return
            }
          }
        })
      }

      return <Navigate to={`/app?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
    }

    if (!authorized?.length) {
      return <Navigate to={lastPath.current} replace />
    }
  }

  lastPath.current = location.pathname + location.search

  return (
    <>
      {props.children}
      {mall.context}
    </>
  )
}
