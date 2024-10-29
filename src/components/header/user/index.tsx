import UserDefaultPng from '@/assets/icon/user_default.png'
import { useModal } from "@/components/modal"
import { useToken, useUser } from "@/store"
import { Avatar } from "antd"
import LoginForm from "./login-form"
import UserCenter from "./user-center"
import { useTranslation } from "react-i18next"

const HeaderUser = () => {
  const { user } = useUser()
  const { token } = useToken()
  const { t } = useTranslation()

  const loginForm = useModal({
    content: <LoginForm afterLogin={() => loginForm.modal.close()} onClose={() => loginForm.modal.close()} />,
    width: 660,
    footer: false,
    maskClosable: true,
    onOpen: () => { }
  })

  const userCenter = useModal({
    content: <UserCenter onLogout={() => userCenter.modal.close()} />,
    width: 512,
    title: t('user center'),
    footer: false,
    maskClosable: true,
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
      <Avatar src={user?.avatar ?? UserDefaultPng} size={24} className="mr-1" />
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