import { getConfig, getStockCollectCates } from '@/api'
import { useToast } from '@/hooks'
import { appEvent } from '@/utils/event'
import { wsManager } from '@/utils/ws'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMount, useUpdateEffect } from 'ahooks'
import { uid } from 'radash'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useNavigate } from 'react-router'
import {
  AiAlarmNotice,
  Footer,
  HeaderService,
  HeaderUser,
  JknAlert,
  Menu,
  MenuRight,
  Separator,
  StockSelect,
  Toaster
} from './components'
import { HeaderMall } from './components/header/mall'
import { useJoinGroupByInviteCode } from "./pages/groupchat/hooks"
import { router, routes } from './router'
import { useConfig, useToken, useUser } from './store'
import LogoTitle from '@/assets/image/logo-title.png'

export const CHAT_STOCK_JUMP = 'chat_stock_jump'
export const CHAT_TO_APP_REFRESH_USER = 'chat_to_app_refresh_user'
export const APP_TO_CHAT_REFRESH_USER = 'app_to_chat_refresh_user'


const App = () => {
  const setConsults = useConfig(s => s.setConsults)
  const setHasSelected = useConfig(s => s.setHasSelected)
  const setLanguage = useConfig(s => s.setLanguage)
  const language = useConfig(s => s.language)
  const hasSelected = useConfig(s => s.hasSelected)
  const token = useToken(s => s.token)
  const refreshUser = useUser(s => s.refreshUser)
  const { t, i18n } = useTranslation()
  const setUser = useUser(s => s.setUser)
  const notLogin = useRef(0)
  const queryClient = useQueryClient()

  const configQuery = useQuery({
    queryKey: ['system:config'],
    queryFn: () => getConfig()
  })

  // 加群提示
  const inviteModal = useJoinGroupByInviteCode({
    showTip: true,
    onSuccess: () => {
      refreshUser()
    }
  })

  useEffect(() => {
    if (token) {
      refreshUser().then(res => {
        // if (res.buy_inchannel_status === 1) {
        //   inviteModal.open()
        // } else {
        //   inviteModal.close()
        // }

        channel.current?.postMessage({
          type: APP_TO_CHAT_REFRESH_USER,
          payload: res
        })
      })

    }
  }, [token, queryClient.fetchQuery, setUser])

  useUpdateEffect(() => {
    setConsults(configQuery.data?.consults ?? [])
  }, [configQuery.data])

  /**
   * 登录完成
   */
  useEffect(() => {
    if (token) {
      queryClient.prefetchQuery({
        queryKey: [getStockCollectCates.cacheKey],
        queryFn: () => getStockCollectCates(),
        initialData: [{ id: '1', name: '股票金池', create_time: '', active: 1, total: '0' }]
      })
    }
  }, [token, queryClient.prefetchQuery])

  const { toast } = useToast()

  useEffect(() => {
    i18n.changeLanguage(language)
  }, [language, i18n.changeLanguage])

  useMount(() => {
    if (!hasSelected) {
      setHasSelected()
      setLanguage(navigator.language === 'zh-CN' ? 'zh_CN' : 'en')
    }
    i18n.changeLanguage(language)
    useConfig.getState().refreshIp()
  })

  useEffect(() => {
    const handler = (params: { message: string }) => {
      toast({
        description: params.message
      })
    }

    appEvent.on('toast', handler)
    return () => {
      appEvent.off('toast', handler)
    }
  }, [toast])

  const navigate = useNavigate()
  const channel = useRef<BroadcastChannel>()
  useEffect(() => {
    channel.current = new BroadcastChannel('chat-channel')

    channel.current.onmessage = event => {
      if (event.data.type === CHAT_STOCK_JUMP) {
        if (event.data.payload) {
          navigate(`/app/stock/trading?symbol=${event.data.payload}`)
          navigate(`/stock/trading?symbol=${event.data.payload}`)
        }
      } else if (event.data.type === CHAT_TO_APP_REFRESH_USER) {
        refreshUser()
      }
    }
    const handler = () => {
      if (notLogin.current === 0 && window.location.pathname !== '/app') {
        notLogin.current = 1
        JknAlert.info({
          content: '请先登录账号',
          onAction: async () => {
            notLogin.current = 0
            window.location.href = '/'
          }
        })
      }
    }
    appEvent.on('not-login', handler)

    return () => {
      channel.current?.close()
      appEvent.off('not-login', handler)
    }
  }, [navigate])






  return (
    <div className="container-layout dark">
      <Toaster />
      {
        inviteModal.contenxt
      }
      <div className="flex flex-col h-full overflow-hidden w-full">
        <div className="header relative z-10 px-2.5 mr-1 flex items-center flex-shrink-0 h-[56px]">
          <HeaderUser />
          <div className="h-[32px] ml-4"><img className="w-full h-full" src={LogoTitle} /></div>
          <Separator orientation="vertical" className="mx-4 h-4 bg-[#2E2E2E]" />
          <div className="search float-left flex items-center h-full ">
            <StockSelect
              size="sm"
              className="w-[136px] h-[33px] rounded-[300px]"
              placeholder={t('search.stocks')}
              onChange={v => router.navigate(`/stock/trading?symbol=${v}`)}
            />
          </div>

          {/* <div className="absolute top-0 left-0 h-full w-full text-center flex justify-center items-center -z-10">
            <img src={Logo} alt="logo" className="w-6 h-6 mr-2" />
            <AppTitle />
          </div> */}
          <div className="flex items-center h-full space-x-2xl ml-auto">
            <HeaderMall />
            {/* <HeaderService /> */}
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex bg-accent">
          <div className="w-[40px] flex-shrink-0 bg-accent pt-1">
            <div className="h-full bg-background w-full space-y-4 flex flex-col items-center rounded-tr-xs">

              <Menu />
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-hidden p-1 box-border">
              <div className="rounded-xs overflow-hidden w-full h-full">
                <Outlet />
              </div>
            </div>

            <div className="footer px-1 box-border">
              <Footer />
            </div>
          </div>

          <div className="w-[40px] flex-shrink-0 flex flex-col mt-1 bg-background rounded-tl-xs">
            <MenuRight />
            <div className="mt-auto">
              <AiAlarmNotice />
            </div>
          </div>
        </div>
      </div>

      {/* 
      <div className="main overflow-hidden">

        <div className="float-right bg-background h-full sider">
          <div className="flex flex-col items-center h-full">

          </div>
        </div>
        <div className="content overflow-hidden">

        </div>
      </div> */}

      <style jsx>
        {`
          .container-layout {
            background-color: hsl(var(--background));
            overflow: hidden;
            height: 100vh;
            position: relative;
            width: 100vw;
            box-sizing: border-box;
            display: flex;
            min-width: 1024px;
            min-height: 810px;
            color: hsl(var(--text));
          }

          .sider {
            width: 54px;
          }

          .main {
            height: calc(100% - 35px);
          }

          .header {
            height: 56px;
          }

          .content {
            height: 100%;
            box-sizing: border-box;
            background: var(--bg-secondary-color);
          }

          .content > div:first-child {
            height: calc(100% - 28px);
          }

          .footer {
            font-size: 12px;
            height: 28px;
            line-height: 28px;
            display: flex;
            align-items: center;
          }
        `}
      </style>
    </div>
  )
}

const AppTitle = () => {
  const { t } = useTranslation()
  const [pathname, setPathname] = useState(router.state.location.pathname)

  const { token } = useToken()

  useEffect(() => {
    const channel = new BroadcastChannel('chat-channel')
    if (token) {
      wsManager.send({
        event: 'login',
        data: {
          'token': token
        },
        msg_id: uid(20)
      })
      const close = wsManager.on('connect', () => {
        wsManager.send({
          event: 'login',
          data: {
            'token': token
          },
          msg_id: uid(20)
        })
      })

      const closeOpinion = wsManager.on('opinions', () => {
        channel.postMessage({
          type: 'opinions'
        })
      })

      return () => {
        close()
        closeOpinion()
        channel.close()
      }
    }
    channel.postMessage({
      type: 'logout'
    })

    return () => {
      channel.close()
    }
  }, [token])

  useEffect(() => {
    const s = router.subscribe(s => {
      setPathname(s.location.pathname)
    })

    return () => {
      s()
    }
  }, [])

  const title = useMemo(() => {
    const route = routes
      .find(r => r.path === '/')!
      .children!.find(r => (pathname === '/' ? r.index : r.path === pathname))

    if (pathname.startsWith('/stock')) {
      if (pathname.includes('trading')) {
        return '个股盘口'
      }
      if (pathname.includes('finance')) {
        return '财务分析'
      }
      return '个股盘口'
    }
    return route?.handle?.title
  }, [pathname])

  return (
    <span>
      {t('app')}-{title}
    </span>
  )
}

export default App
