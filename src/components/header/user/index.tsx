import { JknAvatar, JknIcon } from '@/components'
import { useModal } from '@/components/modal'
import { useToken, useUser } from '@/store'
import { appEvent } from '@/utils/event'
import { useMount, useUnmount } from 'ahooks'
import { useTranslation } from 'react-i18next'
import LoginForm from './login-form'
import UserCenter from './user-center'

const HeaderUser = () => {
  const user = useUser(s => s.user)
  const token = useToken(s => s.token)
  const { t } = useTranslation()

  useMount(() => {
    appEvent.on('login', () => {
      if (!token) {
        loginForm.modal.open()
      }
    })
  })

  useUnmount(() => {
    appEvent.off('login')
  })

  const loginForm = useModal({
    content: (
      <LoginForm
        afterLogin={() => {
          loginForm.modal.close()
        }}
        onClose={() => loginForm.modal.close()}
      />
    ),
    footer: null,
    onOpen: () => {}
  })

  const userCenter = useModal({
    content: <UserCenter onLogout={() => userCenter.modal.close()} />,
    className: 'w-[600px]',
    title: t('user center'),
    footer: false,
    closeIcon: true,
    onOpen: () => {}
  })

  const onClick = () => {
    if (!token) {
      loginForm.modal.open()
    } else {
      userCenter.modal.open()
    }
  }

  return (
    <>
      <div className="text-sm flex items-center cursor-pointer" onClick={onClick} onKeyDown={() => {}}>
        <JknIcon.Svg size={24} name="more" />
        {/* <span>{token ? user?.realname : t('login')}</span> */}
      </div>
      {loginForm.context}
      {userCenter.context}
    </>
  )
}

export default HeaderUser
