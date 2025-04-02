import {
  bindInviteCode,
  forgotPassword,
  getUser,
  getWxLoginStatus,
  login,
  loginByThird,
  loginImService,
  registerByEmail,
  sendEmailCode
} from '@/api'
import AppleIcon from '@/assets/icon/apple.png'
import GoogleIcon from '@/assets/icon/google.png'
import WechatLoginIcon from '@/assets/icon/wechat_login.png'
import LoginLeftImg from '@/assets/image/login_left.png'
import { Button, Form, FormControl, FormField, FormItem, FormLabel, Input, JknCheckbox, JknIcon, Separator, useModal } from '@/components'
import { useCheckbox, useToast, useZForm } from '@/hooks'
import { useToken } from '@/store'
import { appEvent } from '@/utils/event'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCountDown, useMount, useUnmount } from 'ahooks'
import dayjs from 'dayjs'
import { LockIcon, MailIcon, RectangleEllipsisIcon } from 'lucide-react'
import QRCode from 'qrcode'
import { uid } from 'radash'
import { useEffect, useRef, useState } from 'react'
import type { SubmitErrorHandler } from 'react-hook-form'
import { z } from 'zod'

interface LoginFormProps {
  afterLogin?: () => void
  onClose?: () => void
}

const loginSchema = z.object({
  mobile: z.string().min(2).max(50),
  password: z.string().min(6).max(50)
})

type LoginForm = z.infer<typeof loginSchema>

type GoogleLoginResult = {
  clientId: string
  client_id: string
  credential: string
  select_by: string
}

type AppleLoginResult = {
  authorization: {
    code: string
    id_token: string
    state: string
  }
}

// const LoginModal = (props: LoginFormProps) => {
//   const [page, setPage] = useState<'login' | 'register' | 'resetPassword'>('login')
//   return (
//     <div className="flex login-form">
//       <div className="w-[380px] h-[400px] relative">
//         <div
//           className="absolute left-0 top-0 w-8 h-8 cursor-pointer"
//           onClick={() => props.onClose?.()}
//           onKeyUp={() => {}}
//         />
//         <img src={LoginLeftImg} alt="" className="w-full h-full" />
//       </div>
//       <div className="bg-white h-[400px] w-[280px] box-border flex flex-col px-4">
//         {{
//           login: <LoginForm afterLogin={props.afterLogin} onClose={props.onClose} setPage={setPage} />,
//           register: <RegisterForm setPage={setPage} type="register" />,
//           resetPassword: <RegisterForm setPage={setPage} type="forgot" />
//         }[page] ?? null}
//       </div>
//     </div>
//   )
// }

export const LoginForm = (props: LoginFormProps & { setPage: (page: 'login' | 'register' | 'resetPassword') => void }) => {
  const form = useZForm(loginSchema, { mobile: '', password: '' })
  const setToken = useToken(s => s.setToken)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const onLoginSuccess = (token: string) => {
    setToken(token)

    queryClient.refetchQueries({ queryKey: [getUser.cacheKey] })

    loginImService()

    const code = localStorage.getItem('invite-code')

    if (code) {
      const codeObj = JSON.parse(code)
      if (codeObj.timestamp) {
        const current = dayjs()
        if (current.diff(codeObj.timestamp, 'day') <= 3) {
          bindInviteCode(codeObj.code, codeObj.cid)
        }
      }
    }

    props.afterLogin?.()
  }

  const loginByUsername = () => {
    return login(form.getValues())
  }

  const loginMutation = useMutation({
    mutationFn: ({ type, data }: { type: string; data: any }) => {
      if (type === 'username') {
        return loginByUsername()
      }

      return type === 'apple' ? loginByThird('apple', data) : loginByThird('google', data)
    },
    onSuccess: r => onLoginSuccess(r.token),
    onError: err => {
      toast({
        description: err.message
      })
    }
  })

  return (
    <>
      <div className=" h-full w-[371px] box-border flex flex-col">
        <p className="text-[32px] mb-16">欢迎登录</p>
        <Form {...form}>
          <form className="space-y-5 text-foreground">
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱</FormLabel>
                  <FormControl>
                    <Input
                      size="lg"
                      className="border-border placeholder:text-tertiary"
                      placeholder="请输入邮箱账号"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <Input
                      size="lg"
                      className="border-border placeholder:text-tertiary"
                      placeholder="请输入密码"
                      {...field}
                      type="password"
                    />
                  </FormControl>
                  <div className="text-right text-sm cursor-pointer" onClick={() => props.setPage('resetPassword')} onKeyDown={() => { }}>忘记密码？</div>
                </FormItem>
              )}
            />
          </form>
          <Button
            className="mt-10"
            onClick={() => loginMutation.mutate({ type: 'username', data: {} })}
            block
            size="xl"
            loading={loginMutation.isPending}
          >
            登录
          </Button>
        </Form>
        <div className="flex text-secondary justify-center space-x-4 mt-4 text-sm">
          {/* <div className="cursor-pointer" onClick={() => props.setPage('resetPassword')} onKeyDown={() => { }}>
            忘记密码
          </div> */}
          <div className="text-center">
            还没有账号？
            <span className="cursor-pointer text-primary" onClick={() => props.setPage('register')} onKeyDown={() => { }}>
              立即注册
            </span>
          </div>
        </div>
        <div className="px-4 other-login mt-16">
          <div className="flex items-center mb-2">
            <span className="border-0 border-b border-solid border-accent flex-1" />
            <span className="text-secondary mx-3 text-m">或其他登录方式</span>
            <span className="border-0 border-b border-solid border-accent flex-1" />
          </div>
          <div className="flex items-center justify-between px-20">
            <AppleLogin onLogin={data => loginMutation.mutate({ type: 'apple', data })} />
            <WeChatLogin />
            <GoogleLogin onLogin={data => loginMutation.mutate({ type: 'google', data })} />
          </div>
        </div>
      </div>
    </>
  )
}

interface ThirdLoginFormProps {
  onLogin: (data: any) => void
}

const AppleLogin = (props: ThirdLoginFormProps) => {
  useMount(() => {
    window.AppleID.auth.init({
      clientId: 'com.jkn.app.web',
      redirectURI: import.meta.env.PUBLIC_BASE_APPLE_REDIRECT_URI,
      scope: 'email',
      state: 'https://www.mgjkn.com/main',
      nonce: 'xxx',
      usePopup: true
    })
  })

  const onClick = () => {
    window.AppleID.auth.signIn().then((r: AppleLoginResult) => {
      props.onLogin(r.authorization.code)
    })
  }

  return (
    <div className="apple-login cursor-pointer" onClick={onClick} onKeyUp={() => { }}>
      <JknIcon name="apple-2" className="size-8" />
    </div>
  )
}

const WeChatLogin = () => {
  const modal = useModal({
    content: <WxLoginForm />,
    title: '',
    closeIcon: true,
    footer: null,
    className: 'w-[379px] bg-muted !rounded-[14px]'
  })

  return (
    <>
      <div className="wechat-login w-8 h-8 cursor-pointer" onClick={modal.modal.open} onKeyUp={() => { }}>
        <JknIcon name="wechat-2" className="size-8" />
      </div>
      {modal.context}
    </>
  )
}

const GoogleLogin = (props: ThirdLoginFormProps) => {
  const onLoginRef = useRef(props.onLogin)

  useEffect(() => {
    onLoginRef.current = props.onLogin

    return () => {
      onLoginRef.current = () => { }
    }
  }, [props.onLogin])

  useMount(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: '1084914910896-skncl8a34m47fe8toeak808pvrdn18vr.apps.googleusercontent.com',
        context: 'signin',
        ux_mode: 'popup',
        callback: (res: GoogleLoginResult) => {
          onLoginRef.current(res.credential)
        }
      })

      window.google.accounts.id.renderButton(document.getElementById('google-login'), {
        theme: 'outline',
        type: 'icon',
        size: 'medium',
        text: 'filled_black',
        shape: 'circle'
      })
    }
  })

  const checkGoogleScript = () => {
    if (!window.google) {
      appEvent.emit('toast', { message: '无法连接到Google' })
    }
  }
  return (
    <div className="google-login cursor-pointer relative overflow-hidden size-8">
      <div id="google-login" className="opacity-0 w-full h-full" onClick={checkGoogleScript} onKeyDown={() => { }} />
      <JknIcon name="google-2" className="size-full absolute top-0 left-0 pointer-events-none" />
    </div>
  )
}

const WxLoginForm = () => {
  const canvas = useRef<HTMLCanvasElement>(null)
  const timer = useRef<number>()

  useMount(() => {
    const size = 160
    const sid = uid(10)
    const url = `https://usnode2.mgjkn.com/login/wx?s_id=${sid}&inv_code=${''}&newsrv=1`

    QRCode.toCanvas(canvas.current, url, {
      errorCorrectionLevel: 'Q',
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      margin: 2
    })

    // 中间绘制logo
    const ctx = canvas.current?.getContext('2d')

    // const img = new Image()

    // img.src = WechatLoginIcon

    // img.onload = () => {
    //   // 白底
    //   ctx?.arc(size / 2, size / 2, 20, 0, Math.PI * 2)
    //   ctx!.fillStyle = '#ffffff'
    //   ctx?.fill()
    //   ctx?.drawImage(img, (size - 40) / 2, (size - 40) / 2, 40, 40)
    // }

    timer.current = window.setInterval(() => {
      getWxLoginStatus(sid).then(res => {
        if (res.code) {
          useToken.getState().setToken(res.code)
          window.clearInterval(timer.current)
          window.location.reload()
        }
      })
    }, 4000)
  })

  useUnmount(() => {
    window.clearInterval(timer.current)
  })

  return (
    <div className="h-[351px] flex flex-col items-center justify-center">
      <canvas id="wx-qrcode" className="w-[160px] h-[160px] rounded-[14px]" ref={canvas} />
      <div className="mt-5">
        请用微信扫码登录
      </div>
    </div>
  )
}