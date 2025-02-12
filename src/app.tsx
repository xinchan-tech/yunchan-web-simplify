import { AiAlarmNotice, Footer, HeaderService, HeaderUser, JknAlert, Menu, MenuRight, StockSelect, Toaster } from './components'
import Logo from './assets/icon/icon_jkn@2x.png'
import { Outlet } from "react-router"
import { router, routes } from "./router"
import { useMount, useUpdateEffect } from "ahooks"
import { useConfig, useToken, useUser } from "./store"
import { useTranslation } from "react-i18next"
import { useEffect, useMemo, useRef, useState } from "react"
import { getConfig, getStockCollectCates, getUser } from "@/api"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { appEvent } from "@/utils/event"
import { uid } from "radash"
import { useToast } from "@/hooks"
import { wsManager } from "@/utils/ws"
import { HeaderMall } from "./components/header/mall"

export const CHAT_STOCK_JUMP = 'chat_stock_jump'

const App = () => {
  const setConsults = useConfig(s => s.setConsults)
  const setHasSelected = useConfig(s => s.setHasSelected)
  const setLanguage = useConfig(s => s.setLanguage)
  const language = useConfig(s => s.language)
  const hasSelected = useConfig(s => s.hasSelected)
  const token = useToken(s => s.token)
  const { t, i18n } = useTranslation()
  const setUser = useUser(s => s.setUser)
  const notLogin = useRef(0)
  const queryClient = useQueryClient()



  const query = useQuery({
    queryKey: [getUser.cacheKey],
    queryFn: () => getUser({
      extends: ['authorized']
    }),
    enabled: !!token
  })

  const configQuery = useQuery({
    queryKey: ["system:config"],
    queryFn: () => getConfig(),
  });

  useUpdateEffect(() => {
    if (!query.isLoading) {
      setUser({
        ...query.data
      })
    }
  }, [query.isLoading]);

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

  useMount(() => {
    if (!config.hasSelected) {
      config.setHasSelected();
      config.setLanguage(navigator.language === "zh-CN" ? "zh_CN" : "en");
    if (!hasSelected) {
      setHasSelected()
      setLanguage(navigator.language === 'zh-CN' ? 'zh_CN' : 'en')
    }

    i18n.changeLanguage(language)
  })

const navigate =useNavigate()
  useEffect(() => {
    const channel = new BroadcastChannel("chat-channel");
   
    channel.onmessage=  (event) => {
  
      if (event.data.type === CHAT_STOCK_JUMP) {
       
        if(event.data.payload) {

          navigate(`/app/stock/trading?symbol=${event.data.payload}`);
        }
      }
    }
    const handler = () => {
      if (notLogin.current === 0 && window.location.pathname !== "/app") {
        notLogin.current = 1;
        JknAlert.info({
          content: "请先登录账号",
          onAction: async () => {
            notLogin.current = 0;
            window.location.href = "/";
          },
        });
      }
    };
    appEvent.on("not-login", handler);

    return () => {
      channel.close()
      appEvent.off("not-login", handler);
    };
  }, []);





  return (
    <div className="container-layout dark">
      <Toaster />
      <div className="header relative z-10 px-4">
        <div className="search float-left flex items-center h-full">
          <StockSelect size="mini" placeholder={t('search.stocks')} onChange={v => router.navigate(`/stock/trading?symbol=${v}`)} />
        </div>

        <div className="absolute top-0 left-0 h-full w-full text-center flex justify-center items-center -z-10">
          <img src={Logo} alt="logo" className="w-6 h-6 mr-2" />
          <AppTitle />
        </div>
        <div className="float-right flex items-center h-full space-x-2xl">
          <HeaderMall />
          <HeaderService />
          <HeaderUser />
        </div>
      </div>
      <div className="main overflow-hidden">
        <div className="sider h-full float-left bg-background">
          <Menu />
        </div>
        <div className="float-right bg-background h-full sider">
          <div className="flex flex-col items-center h-full">
            <MenuRight />

            <div className="mt-auto">
              <AiAlarmNotice />
            </div>
          </div>
        </div>
        <div className="content overflow-hidden">
          <div className="bg-muted">
            <Outlet />
            {/* <Suspense fallback={<div />}>
              <RouterProvider router={router} />
            </Suspense> */}
          </div>

          <div className="footer border-style-primary">
            <Footer />
          </div>
        </div>
      </div>

      <style jsx>
        {`
          .container-layout {
            background-color: hsl(var(--background));
            overflow: hidden;
            height: 100vh;
            position: relative;
            width: 100vw;
            box-sizing: border-box;
            min-width: 1425px;
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
            height: 35px;
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
  );
};

const AppTitle = () => {
  const { t } = useTranslation()
  const [pathname, setPathname] = useState(router.state.location.pathname)

  const { token } = useToken()

  useEffect(() => {
    const channel = new BroadcastChannel("chat-channel");
    if (token) {
      wsManager.send({
        event: "login",
        data: {
          "token": token
        },
        msg_id: uid(20)
      })
      const close = wsManager.on('connect', () => {
        wsManager.send({
          event: "login",
          data: {
            "token": token
          },
          msg_id: uid(20)
        })
      })

      const closeOpinion = wsManager.on("opinions", () => {
        channel.postMessage({
          type: "opinions",
        });
      });

      return () => {
        close();
        closeOpinion();
        channel.close()
      };
    } else {
      channel.postMessage({
        type: "logout",
      });

      return  channel.close;
    }
    
  }, [token]);

  useEffect(() => {
    const s = router.subscribe((s) => {
      setPathname(s.location.pathname);
    });

    return () => {
      s();
    };
  }, []);

  const title = useMemo(() => {
    const route = routes.find(r => r.path === '/')!.children!.find((r) => pathname === '/' ? r.index : (r.path === pathname))

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
      {t("app")}-{title}
    </span>
  );
};

export default App;
