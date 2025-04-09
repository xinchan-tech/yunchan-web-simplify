import LogoTitle from '@/assets/image/logo-title-sm.png'
import PcDownload from '@/assets/image/pc-download.png'
import AndroidDownload from '@/assets/image/android-download.png'
import IosDownload from '@/assets/image/ios-download.png'
import { Button, JknIcon, StockSelect } from '@/components'
import { useToken, useUser } from '@/store'
import { Link, Outlet, useNavigate } from 'react-router'
import { HeaderSetting } from '@/components/header/setting'

const HomePage = () => {
  const hasAuthorized = useUser(s => s.hasAuthorized())
  const token = useToken(s => s.token)
  const navigate = useNavigate()

  const gotoLogin = () => {
    navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
  }

  return (
    <div className="home-container h-screen w-full overflow-y-auto bg-[#0A0A0A]">
      <div className="home-navigate flex items-center justify-between px-12 py-2 sticky top-0 bg-[#0a0a0a]">
        <div className="home-logo w-[186px] h-[43px]">
          <img src={LogoTitle} alt="logo" className="size-full" />
        </div>
        <div className="flex items-center space-x-12">
          <StockSelect className="rounded-[300px] bg-[#2E2E2E] px-3" onChange={v => navigate(`/stock?symbol=${v}`)} />
          <Link to="/mall" className="home-navigate-item hover:text-primary">
            价格
          </Link>
          <Link to="/home/features" className="home-navigate-item hover:text-primary">
            特色功能
          </Link>
          <Link to="/stock?symbol=QQQ" className="home-navigate-item hover:text-primary">
            图表
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {token ? (
            <HeaderSetting />
          ) : (
            <JknIcon.Svg name="user" size={24} className="cursor-pointer" onClick={gotoLogin} />
          )}
          {hasAuthorized ? null : (
            <Link
              to="/mall"
              className="linear-gradient-1 w-[90px] h-[38px] rounded-xl text-white cursor-pointer flex items-center justify-center"
            >
              开通会员
            </Link>
            // <Button className="linear-gradient-1 w-[90px] h-[38px] rounded-xl text-white cursor-pointer" onClick={() =>}></Button>
          )}
        </div>
      </div>
      <div className="home-content">
        <Outlet />
      </div>
      <div className="home-footer w-[754px] mx-auto my-24">
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
            <Link to="/home">牛人招募</Link>
            <Link to="/home">分享佣金</Link>
            <Link to="/home">Ai-轻量化</Link>
            <Link to="/mall">价格计划</Link>
          </div>
          <div className="home-footer-item flex flex-col space-y-4">
            <p className="text-white text-xl mb-9">用户协议</p>
            <Link to="/home">隐私政策</Link>
            <Link to="/home">Cookies政策</Link>
            <Link to="/home">免责声明</Link>
            <Link to="/mall">反馈安全漏洞</Link>
          </div>
          <div className="home-footer-item flex flex-col space-y-1">
            <p className="text-white text-xl">下载</p>
            <Link to="/home">
              <img src={PcDownload} alt="logo" className="h-[46px] w-[196px]" />
            </Link>
            <Link to="/home">
              <img src={AndroidDownload} alt="logo" className="h-[46px] w-[196px]" />
            </Link>
            <Link to="/home">
              <img src={IosDownload} alt="logo" className="h-[46px] w-[196px]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
