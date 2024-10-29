import { Input, Spin, theme } from 'antd'
import { HeaderService, HeaderUser, Menu } from './components'
import Logo from './assets/icon/icon_jkn@2x.png'
import './app.scss'
import { SearchOutlined } from "@ant-design/icons"
import { RouterProvider } from "react-router-dom"
import { router } from "./router"
import { useMount } from "ahooks"
import { useConfig } from "./store"
import { useTranslation } from "react-i18next"
import { Suspense } from "react"

const App = () => {
  const { token } = theme.useToken()
  const config = useConfig()
  const { t, i18n } = useTranslation()

  useMount(() => {
    if (!config.hasSelected) {
      config.setHasSelected()
      config.setLanguage(navigator.language === 'zh-CN' ? 'zh_CN' : 'en')
    }

    i18n.changeLanguage(config.language)
  })

  return (
    <div className="container">

      <div className="header relative z-10 px-4">
        <div className="search float-left flex items-center h-full">
          <Input prefix={<SearchOutlined />} size="small" placeholder={t('search.stocks')} />
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
        <div className="sider h-full float-left">
          <Menu />
        </div>
        <div className="content ">
          <Suspense fallback={<Spin spinning />}>
            <RouterProvider router={router} />
          </Suspense>
        </div>
      </div>

      <style jsx>
        {`
          .container {
            background: ${token.colorBgBase};
            overflow: hidden;
            height: 100vh;
            position: relative;
            width: 100vw;
            box-sizing: border-box;
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
            padding: 16px;
            padding-left: calc(54px + 16px);
          }
        `}
      </style>
    </div>
  )
}

export default App
