import AndroidDownload from '@/assets/image/android-download.png'
import IosDownload from '@/assets/image/ios-download.png'
import LogoTitle from '@/assets/image/logo-title-sm.png'
import ApkDownload from '@/assets/image/apk-download.png'
import { JknAlert, JknIcon, StockSelect } from '@/components'
import { HeaderSetting } from '@/components/header/setting'
import { useToken, useUser } from '@/store'
import { cn } from "@/utils/style"
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { sysConfig } from "@/utils/config"

const HomePage = () => {
  const hasAuthorized = useUser(s => s.hasAuthorized())
  const token = useToken(s => s.token)
  const navigate = useNavigate()
  const location = useLocation()

  const gotoLogin = () => {
    navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
  }

  const gotoDashboard = () => {
    navigate('/')
  }

  const toast = () => {
    JknAlert.toast('即将推出，敬请期待')
  }

  return (
    <div className="home-container h-screen w-full overflow-y-auto bg-[#0A0A0A]">
      <div className="home-navigate flex items-center justify-between px-12 py-2 sticky top-0 bg-[#0a0a0a]">
        <div className="home-logo w-[186px] h-[43px] cursor-pointer" onClick={gotoDashboard} onKeyDown={() => { }}>
          <img src={LogoTitle} alt="logo" className="size-full" />
        </div>
        <div className="flex items-center space-x-12">
          <StockSelect className="rounded-[300px] bg-[#2E2E2E] px-3" onChange={v => navigate(`/app/stock?symbol=${v}`)} />
          <Link to="/app/mall" className="home-navigate-item hover:text-primary">
            价格
          </Link>
          <Link to="/features" className={cn('home-navigate-item hover:text-primary', location.pathname === '/features' && '!text-primary')}>
            特色功能
          </Link>
          <Link to="/app/stock?symbol=QQQ" className="home-navigate-item hover:text-primary">
            行情
          </Link>
          <a href="#download" className="home-navigate-item hover:text-primary">
            下载
          </a>
        </div>
        <div className="flex items-center space-x-4">
          {token ? (
            <HeaderSetting />
          ) : (
            <JknIcon.Svg name="user" size={24} className="cursor-pointer" onClick={gotoLogin} />
          )}
          <Link
            to="/app/mall"
            className="linear-gradient-1 w-[76px] h-[36px] rounded-lg text-white font-bold text-sm cursor-pointer flex items-center justify-center !ml-10"
          >
            开通会员
          </Link>
        </div>
      </div>
      <div className="home-content">
        <Outlet />
      </div>
      <div className="home-footer home-content-w-1 mx-auto my-24 px-32 box-border ">
        <div className="home-logo w-[150px] h-[38px]">
          <img src={LogoTitle} alt="logo" className="size-full" />
        </div>
        <div className="space-x-4 my-2.5">
          <JknIcon.Svg className="cursor-pointer" name="x" size={24} />
          <JknIcon.Svg className="cursor-pointer" name="youtube" size={24} />
          <JknIcon.Svg className="cursor-pointer" name="tiktok" size={24} />
          <JknIcon.Svg className="cursor-pointer" name="telegram" size={24} />
          <JknIcon.Svg className="cursor-pointer" name="discord" size={24} />
        </div>
        <div className="text-sm text-[#808080] flex justify-between">
          <div className="home-footer-item flex flex-col space-y-4">
            <p className="text-white text-xl mb-10">关于我们</p>
            <Link to="/">牛人招募</Link>
            <Link to="/">分享佣金</Link>
            <Link to="/">Ai-轻量化</Link>
            <Link to="/app/mall">价格计划</Link>
          </div>
          <div className="home-footer-item flex flex-col space-y-4">
            <p className="text-white text-xl mb-9">用户协议</p>
            <Link to="/">隐私政策</Link>
            <Link to="/cookies">Cookies政策</Link>
            <Link to="/">免责声明</Link>
            <Link to="/">反馈安全漏洞</Link>
          </div>
          <div className="home-footer-item flex flex-col space-y-1">
            <p className="text-white text-xl" id="download">下载</p>
            {
              sysConfig.OS === 'ios' ? (
                <span onClick={() => JknAlert.toast('iOS 版本即将推出，敬请期待')} onKeyDown={() => { }}>
                  <img src={ApkDownload} alt="logo" className="h-[46px] w-[196px]" />
                </span>
              ) : (
                <a href="https://xinmei-downloads.s3.us-east-1.amazonaws.com/todaychart_v1.0.0.apk">
                  <img src={ApkDownload} alt="logo" className="h-[46px] w-[196px]" />
                </a>
              )
            }
            <span onClick={toast} onKeyDown={() => { }}>
              <img src={AndroidDownload} alt="logo" className="h-[46px] w-[196px]" />
            </span>
            <span onClick={toast} onKeyDown={() => { }}>
              <img src={IosDownload} alt="logo" className="h-[46px] w-[196px]" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
