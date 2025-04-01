import { logout } from "@/api"
import { JknAlert, JknAvatar, JknIcon, Popover, PopoverContent, PopoverTrigger, useModal } from "@/components"
import { useToast } from "@/hooks"
import { useToken, useUser } from "@/store"
import to from "await-to-js"
import type { ReactNode } from "react"
import LoginForm from "../user/login-form"
import UserCenter from "../user/user-center"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { useBoolean, useMount, useUnmount } from "ahooks"
import { appEvent } from "@/utils/event"
import logoTitleSm from '@/assets/image/logo-title-sm.png'

export const HeaderSetting = () => {
  const token = useToken(s => s.token)
  const user = useUser(s => s.user)
  const { toast } = useToast()
  const reset = useUser(s => s.reset)
  const { t } = useTranslation()
  const removeToken = useToken(s => s.removeToken)
  const navigate = useNavigate()
  const [visible, { setFalse, toggle }] = useBoolean()

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

  const onLogout = async () => {
    setFalse()
    JknAlert.confirm({
      title: '退出登录',
      content: '确定要退出登录吗？',
      onAction: async status => {
        if (status === 'confirm') {
          const [err] = await to(logout())

          if (err) {
            toast({
              description: err.message
            })
            return
          }

          reset()
          removeToken()
          if (window.location.pathname !== '/') {
            window.location.href = '/'
          }
        }
      }
    })
  }

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
    onOpen: () => {
      setFalse()
    }
  })

  const userCenter = useModal({
    content: <UserCenter />,
    className: 'w-[600px]',
    title: t('user center'),
    footer: false,
    closeIcon: true,
    onOpen: () => {
      setFalse()
    }
  })

  return (
    <>
      <Popover open={visible} onOpenChange={toggle}>
        <PopoverTrigger asChild>
          <span>
            {
              token ? (
                <JknAvatar src={user?.avatar} title={user?.realname} className="size-8" />
              ) : <JknIcon.Svg size={32} name="more" />
            }
          </span>
        </PopoverTrigger>
        <PopoverContent align="start" side="right" sideOffset={10} className="w-[260px]">
          <div className="pb-2 pt-2 px-2.5 border-b-primary">
            <img src={logoTitleSm} alt="logo" className="w-[143px] h-8" />
          </div>
          <div className="border-b-primary">
            {
              token ? (
                <HeaderSettingCell
                  icon={<JknAvatar src={user?.avatar} title={user?.realname} className="size-5" />}
                  title={user?.realname}
                  onClick={() => userCenter.modal.open()}
                />
              ) : null
            }
            <HeaderSettingCell
              icon="home"
              title="返回官网"
              onClick={() => { navigate('/'); setFalse() }}
            />
            <HeaderSettingCell
              icon="theme"
              title="暗色主图"
            />
            <HeaderSettingCell
              icon="setting"
              title="软件设置"
              onClick={() => { navigate('/setting'); setFalse() }}
            />
            <HeaderSettingCell
              icon="language"
              title="语言"
            />
            <HeaderSettingCell
              icon="service"
              title="客服"
            />
          </div>
          <div>
            {
              token ? (
                <HeaderSettingCell
                  icon="login"
                  title="退出"
                  label=" "
                  color="#D61B5F"
                  onClick={onLogout}
                />
              ) : (
                <HeaderSettingCell
                  icon="login"
                  title="登录"
                  label=" "
                  color="#2962FF"
                  onClick={() => loginForm.modal.open()}
                />
              )
            }
          </div>
        </PopoverContent>
      </Popover>
      {
        loginForm.context
      }
      {
        userCenter.context
      }
    </>
  )
}

interface HeaderSettingCellProps {
  icon: ReactNode | IconName
  title?: string
  label?: ReactNode
  color?: string
  onClick?: () => void
}
const HeaderSettingCell = ({ icon, title, label, color, onClick }: HeaderSettingCellProps) => {
  return (
    <div className="flex items-center px-2.5 w-full text-sm h-11 hover:bg-accent box-border cursor-pointer" style={{ color }} onClick={onClick} onKeyDown={() => { }}>
      {
        typeof icon === 'string' ? (
          <JknIcon.Svg name={icon as IconName} size={20} />
        ) : (
          icon
        )
      }
      <span className="ml-2.5">{title}</span>
      {label ? <span className="ml-auto">{label}</span> : <JknIcon.Svg name="arrow-right" className="ml-auto" size={8} />}
    </div>
  )
}

