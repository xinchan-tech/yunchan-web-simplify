import { Input, Spin, theme } from 'antd'
import { HeaderService, HeaderUser, Menu } from './components'
import Logo from './assets/icon/icon_jkn@2x.png'
import './app.scss'
import { SearchOutlined } from "@ant-design/icons"
import { RouterProvider } from "react-router-dom"
import { router } from "./router"
import { useMount, useRequest } from "ahooks"
import { useConfig } from "./store"
import { useTranslation } from "react-i18next"
import { Suspense } from "react"
import { getConfig, getUsTime } from "./api"
import dayjs from "dayjs"

const App = () => {
  const { token } = theme.useToken()
  const config = useConfig()
  const { t, i18n } = useTranslation()
  useRequest(getConfig)

  useRequest(getUsTime, {
    pollingInterval: 1000 * 60 * 1,
    onSuccess: (data) => {
      if (data.time) {
        config.setUsTime(data.time)
      }
    }
  })

  useMount(() => {
    if (!config.hasSelected) {
      config.setHasSelected()
      config.setLanguage(navigator.language === 'zh-CN' ? 'zh_CN' : 'en')
    }

    i18n.changeLanguage(config.language)
  })

  const weeks = config.language === 'zh_CN' ? ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="container-layout">

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
        <div className="sider h-full float-left bg-primary">
          <Menu />
        </div>
        <div className="content">
          <Suspense fallback={<Spin spinning />}>
            <RouterProvider router={router} />
          </Suspense>
          <div>
            <div className="footer">
              <div className="text-center">
                {
                  config.usTime && (
                    <span>
                      {dayjs(config.usTime).tz('America/New_York').format('MM-DD')}
                      {weeks[dayjs(config.usTime).tz('America/New_York').day()]}
                      {dayjs(config.usTime).tz('America/New_York').format('HH:mm:ss')}
                    </span>
                  )
                }
              </div>
            </div>
          </div>
        </div>

      </div>

      <style jsx>
        {`
          .container-layout {
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
            background: ${token.colorBgContainer};
            padding-bottom: 20px;
          }
        `}
      </style>
    </div>
  )
}

export default App
