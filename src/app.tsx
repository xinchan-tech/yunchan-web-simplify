import { AiAlarmNotice, Footer, HeaderService, HeaderUser, Menu, MenuRight, StockSelect, Toaster } from './components'
import Logo from './assets/icon/icon_jkn@2x.png'
import './app.scss'
import { RouterProvider } from "react-router-dom"
import { router } from "./router"
import { useMount, useUpdateEffect } from "ahooks"
import { useConfig, useServers, useUser } from "./store"
import { useTranslation } from "react-i18next"
import { Suspense } from "react"
import { getConfig, getUser } from "./api"
import { useQuery } from "@tanstack/react-query"

const App = () => {
  const config = useConfig()
  const { setServers } = useServers()
  const { t, i18n } = useTranslation()
  const user = useUser()
  const query = useQuery({
    queryKey: [getUser.cacheKey],
    queryFn: () => getUser({
      extends: ['authorized']
    })
  })

  const configQuery = useQuery({
    queryKey: ['system:config'],
    queryFn: () => getConfig()
  })

  useUpdateEffect(() => {
    if (!query.isLoading) {
      user.setUser({
        ...query.data
      })
    }
  }, [query.isLoading])

  useUpdateEffect(() => {
    config.setConsults(configQuery.data?.consults ?? [])
    // setServers(configQuery.data?.servers ?? [])
  }, [configQuery.data])




  useMount(() => {
    if (!config.hasSelected) {
      config.setHasSelected()
      config.setLanguage(navigator.language === 'zh-CN' ? 'zh_CN' : 'en')
    }

    i18n.changeLanguage(config.language)
  })

  return (
    <div className="container-layout dark">
      <Toaster />
      <div className="header relative z-10 px-4">
        <div className="search float-left flex items-center h-full">
          <StockSelect size="mini" placeholder={t('search.stocks')} />
        </div>

        <div className="absolute top-0 left-0 h-full w-full text-center flex justify-center items-center -z-10">
          <img src={Logo} alt="logo" className="w-6 h-6 mr-2" />
          {t('app')}-首页
        </div>
        <div className="float-right flex items-center h-full space-x-2xl">
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
          <div>
            <Suspense fallback={<div />}>
              <RouterProvider router={router} />
            </Suspense>
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
            color: hsl(var(--text))
          }

          .sider{
            width: 54px;
          }

          .main{
            height: calc(100% - 35px);
          }

          .header{
            height: 35px;
          }

          .content{
            height: 100%;
            box-sizing: border-box;
            background: var(--bg-secondary-color);
          }

          .content > div:first-child {
            height: calc(100% - 28px);
          }

          .footer{
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

export default App
