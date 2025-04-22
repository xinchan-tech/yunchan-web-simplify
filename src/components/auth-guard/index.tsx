import { useToken, useUser } from '@/store'
import { appEvent } from '@/utils/event'
import { type PropsWithChildren, useEffect, useRef } from 'react'
import { Navigate, redirect, useLocation, useNavigate } from 'react-router'
import { JknAlert } from '../jkn/jkn-alert'
import { MallPackages } from '../mall-dialog'
import { useModal } from '../modal'
import qs from "qs"
import { AESCrypt } from "@/utils/string"

export const routeWhiteList = ['/app/mall', '/app', '/app/login']
export const routeNotAuthList = ['/app/user']

export const AuthGuard = (props: PropsWithChildren) => {
  const location = useLocation()
  const token = useToken(s => s.token)
  const hasAuthorized = useUser(s => s.hasAuthorized())
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
          mall.modal.close()
          navigate('/app/mall')
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
      const query = qs.parse(location.search, { ignoreQueryPrefix: true })
      if (!query.redirect) {
        query.redirect = location.pathname + location.search
      }

      if (!showLogin.current) {
        showLogin.current = true
        JknAlert.info({
          content: '请先登录账号',
          onAction: async e => {
            showLogin.current = false
            if (e === 'confirm') {
              navigate(`/app/login?${qs.stringify(query)}`, {
                replace: true
              })
              return
            }
          }
        })
      }

      return <Navigate to={`/app?${qs.stringify(query)}`} replace />
    }

    if (!hasAuthorized && !routeNotAuthList.some(route => location.pathname.startsWith(route))) {
      const q = AESCrypt.encrypt(JSON.stringify({ mall: true }))
      const query = qs.parse(location.search, { ignoreQueryPrefix: true })
      if (!query.redirect) {
        query.redirect = location.pathname + location.search
      }
      return <Navigate to={`/app?${qs.stringify({ ...query, q })}`} replace />
    }
  }



  return (
    <>
      {props.children}
      {mall.context}
    </>
  )
}
