import { sysConfig } from "@/utils/config"
import { HeaderSetting } from '../setting'

const HeaderUser = () => {
  return (
    <>
      <div className="text-sm flex items-center cursor-pointer space-x-2" onKeyDown={() => {}}>
        {/* <JknIcon.Svg size={24} name="more" /> */}
        <HeaderSetting />
        {
          sysConfig.PUBLIC_BASE_BUILD_ENV !== 'PRODUCTION' && (
            <span className="text-destructive">&nbsp;非线上版本</span>
          )
        }
        {/* <span>{token ? user?.realname : t('login')}</span> */}
      </div>
    </>
  )
}

export default HeaderUser
