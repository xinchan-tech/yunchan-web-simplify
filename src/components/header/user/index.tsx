import UserDefaultPng from '@/assets/icon/user_default.png'
import { Avatar, AvatarFallback, AvatarImage, JknAvatar } from "@/components"
import { useModal } from "@/components/modal"
import { useToken, useUser } from "@/store"
import { appEvent } from "@/utils/event"
import { useMount, useUnmount } from "ahooks"
import { useTranslation } from "react-i18next"
import LoginForm from "./login-form"
import UserCenter from "./user-center"

const HeaderUser = () => {
  const { user } = useUser()
  const { token } = useToken()
  const { t } = useTranslation()

  useMount(() => {
    appEvent.on('login', () => {
      if(!token){
        loginForm.modal.open()
      }
    })
  })

  useUnmount(() => {
    appEvent.off('login')
  })

  const loginForm = useModal({
    content: <LoginForm afterLogin={() => loginForm.modal.close()} onClose={() => loginForm.modal.close()} />,
    footer: null,
    onOpen: () => { }
  })

  const userCenter = useModal({
    content: <UserCenter onLogout={() => userCenter.modal.close()} />,
    className: 'w-[500px]',
    title: t('user center'),
    footer: false,
    closeIcon: true,
    onOpen: () => { }
  })

  const onClick = () => {
    if (!token) {
      loginForm.modal.open()
    } else {
      userCenter.modal.open()
    }
  }

  return (
    <div className="text-sm flex items-center cursor-pointer" >
      <JknAvatar className="w-5 h-5 mr-2" src={user?.avatar} />
      <span onClick={onClick} onKeyDown={() => { }}>{user?.realname ?? t('login')}</span>
      {
        loginForm.context
      }
      {
        userCenter.context
      }
    </div>
  )
}

export default HeaderUser