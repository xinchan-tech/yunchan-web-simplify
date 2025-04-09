import { HeaderSetting } from '../setting'

const HeaderUser = () => {
  return (
    <>
      <div className="text-sm flex items-center cursor-pointer" onKeyDown={() => {}}>
        {/* <JknIcon.Svg size={24} name="more" /> */}
        <HeaderSetting />
        {/* <span>{token ? user?.realname : t('login')}</span> */}
      </div>
    </>
  )
}

export default HeaderUser
