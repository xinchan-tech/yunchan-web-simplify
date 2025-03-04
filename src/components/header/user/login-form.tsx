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
import WechatLoginIcon from '@/assets/icon/wechat_login.png'
import LoginLeftImg from '@/assets/image/login_left.png'
import AppleIcon from '@/assets/icon/apple.png'
import GoogleIcon from '@/assets/icon/google.png'
import { useToken } from '@/store'
import { z } from 'zod'
import { Button, Form, FormControl, FormField, FormItem, Input, JknCheckbox, Separator, useModal } from '@/components'
import { useCheckbox, useToast, useZForm } from '@/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCountDown, useMount, useUnmount } from 'ahooks'
import { useEffect, useRef, useState } from 'react'
import { uid } from 'radash'
import QRCode from 'qrcode'
import { appEvent } from '@/utils/event'
import { LockIcon, MailIcon, RectangleEllipsisIcon } from 'lucide-react'
import type { SubmitErrorHandler } from 'react-hook-form'
import dayjs from 'dayjs'

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

const LoginModal = (props: LoginFormProps) => {
  const [page, setPage] = useState<'login' | 'register' | 'resetPassword'>('login')
  return (
    <div className="flex login-form">
      <div className="w-[380px] h-[400px] relative">
        <div
          className="absolute left-0 top-0 w-8 h-8 cursor-pointer"
          onClick={() => props.onClose?.()}
          onKeyUp={() => {}}
        />
        <img src={LoginLeftImg} alt="" className="w-full h-full" />
      </div>
      <div className="bg-white h-[400px] w-[280px] box-border flex flex-col px-4">
        {{
          login: <LoginForm afterLogin={props.afterLogin} onClose={props.onClose} setPage={setPage} />,
          register: <RegisterForm setPage={setPage} type="register" />,
          resetPassword: <RegisterForm setPage={setPage} type="forgot" />
        }[page] ?? null}
      </div>
    </div>
  )
}

const LoginForm = (props: LoginFormProps & { setPage: (page: 'login' | 'register' | 'resetPassword') => void }) => {
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
      <div className="bg-white h-full w-full box-border flex flex-col">
        <p className="text-[#3861F6] mt-12 text-lg">登录账号</p>
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      className="bg-[#dcdcdc] border-none placeholder:text-tertiary text-tertiary"
                      placeholder="请输入账号"
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
                  <FormControl>
                    <Input
                      className="bg-[#dcdcdc] border-none placeholder:text-tertiary text-tertiary"
                      placeholder="请输入密码"
                      {...field}
                      type="password"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
          <Button
            className="mt-4"
            onClick={() => loginMutation.mutate({ type: 'username', data: {} })}
            block
            loading={loginMutation.isPending}
          >
            登录
          </Button>
        </Form>
        <div className="flex text-xs text-secondary justify-center space-x-4 mt-4">
          <div className="cursor-pointer" onClick={() => props.setPage('resetPassword')} onKeyDown={() => {}}>
            忘记密码
          </div>
          <Separator orientation="vertical" className="bg-[hsl(var(--text-secondary))]" />
          <div className="cursor-pointer" onClick={() => props.setPage('register')} onKeyDown={() => {}}>
            立即注册
          </div>
        </div>
        <div className="px-4 other-login mt-8">
          <div className="flex items-center mb-2">
            <span className="border-0 border-b border-solid border-gray-300 flex-1" />
            <span className="text-secondary mx-2 text-xs">其他登录方式</span>
            <span className="border-0 border-b border-solid border-gray-300 flex-1" />
          </div>
          <div className="flex items-center justify-between px-10">
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
    <div className="apple-login w-6 h-6 cursor-pointer" onClick={onClick} onKeyUp={() => {}}>
      <img src={AppleIcon} alt="" className="w-full h-full" />
    </div>
  )
}

const WeChatLogin = () => {
  const modal = useModal({
    content: <WxLoginForm />,
    title: '微信登录',
    closeIcon: true,
    footer: null,
    className: 'w-[640px]'
  })

  return (
    <>
      <div className="wechat-login w-8 h-8 cursor-pointer" onClick={modal.modal.open} onKeyUp={() => {}}>
        <img src={WechatLoginIcon} alt="" className="w-full h-full" />
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
      onLoginRef.current = () => {}
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
    <div className="google-login cursor-pointer relative overflow-hidden w-6 h-6">
      <div id="google-login" className="opacity-0 w-full h-full" onClick={checkGoogleScript} onKeyDown={() => {}} />
      <img src={GoogleIcon} alt="" className="w-full h-full absolute top-0 left-0 pointer-events-none" />
    </div>
  )
}

const WxLoginForm = () => {
  const canvas = useRef<HTMLCanvasElement>(null)
  const timer = useRef<number>()

  useMount(() => {
    const size = 160
    const sid = uid(10)
    const url = `https://us.mgjkn.com/login/wx?s_id=${sid}&inv_code=${''}`

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

    const img = new Image()

    img.src = WechatLoginIcon

    img.onload = () => {
      // 白底
      ctx?.arc(size / 2, size / 2, 20, 0, Math.PI * 2)
      ctx!.fillStyle = '#ffffff'
      ctx?.fill()
      ctx?.drawImage(img, (size - 40) / 2, (size - 40) / 2, 40, 40)
    }

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
    <div className="h-[400px] flex">
      <canvas id="wx-qrcode" className="w-[160px] h-[160px] m-auto" ref={canvas} />
    </div>
  )
}

const registerSchema = z
  .object({
    username: z.string().email({ message: '请输入正确的邮箱' }),
    password: z.string().min(6, { message: '最少输入6位密码' }).max(50),
    passwordConfirm: z.string(),
    code: z.string()
  })
  .refine(data => data.password === data.passwordConfirm, { message: '两次密码输入不一致' })

type RegisterSchema = z.infer<typeof registerSchema>

const RegisterForm = (props: {
  type: 'forgot' | 'register'
  setPage: (page: 'login' | 'register' | 'resetPassword') => void
}) => {
  const form = useZForm(registerSchema, { username: '', password: '', passwordConfirm: '', code: '' })
  const [time, setTime] = useState<number | undefined>()
  const { checked, toggle } = useCheckbox(false)

  const { toast } = useToast()
  const onError: SubmitErrorHandler<RegisterSchema> = err => {
    toast({
      description: Object.values(err)[0].message
    })
  }

  const sendCode = useMutation({
    mutationFn: async () => {
      const r = await form.trigger('username')
      if (!r) {
        toast({
          description: '请输入正确的邮箱'
        })
        throw new Error('请输入正确的邮箱')
      }

      await sendEmailCode(form.getValues('username'), props.type)
    },
    onSuccess: () => {
      toast({
        description: '验证码已发送'
      })
      setTime(60 * 1000)
    },
    onError: e => {
      toast({
        description: e.message
      })
    }
  })

  const register = useMutation({
    mutationFn: (data: RegisterSchema) => {
      if (props.type === 'register' && !checked) {
        throw new Error('请先阅读并接受《服务条款》')
      }
      const r: Parameters<typeof registerByEmail>[0] = {
        username: data.username,
        password: data.password,
        password_confirm: data.passwordConfirm,
        code: data.code
      }

      return props.type === 'register' ? registerByEmail(r) : forgotPassword(r)
    },
    onSuccess: () => {
      toast({
        description: props.type === 'register' ? '注册成功' : '重置密码成功'
      })
      props.setPage('login')
    },
    onError: e => {
      toast({
        description: e.message
      })
    }
  })

  return (
    <div className="bg-white h-full w-full box-border flex flex-col">
      <p className="text-[#3861F6] mt-8 text-lg">{props.type === 'register' ? '注册账号' : '忘记密码'}</p>
      <Form {...form}>
        <form className="space-y-2" onSubmit={form.handleSubmit(v => register.mutate(v), onError)}>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem className="flex items-center bg-[#dcdcdc] border-none rounded-sm overflow-hidden text-tertiary space-y-0 px-2">
                <MailIcon className="w-4 h-4" />
                <FormControl>
                  <Input
                    className="border-none placeholder:text-tertiary text-tertiary"
                    placeholder="请输入邮箱"
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
              <FormItem className="flex items-center bg-[#dcdcdc] border-none rounded-sm overflow-hidden text-tertiary space-y-0 px-2">
                <LockIcon className="w-4 h-4" />
                <FormControl>
                  <Input
                    className="border-none placeholder:text-tertiary text-tertiary"
                    placeholder="请输入密码"
                    {...field}
                    type="password"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="passwordConfirm"
            render={({ field }) => (
              <FormItem className="flex items-center bg-[#dcdcdc] border-none rounded-sm overflow-hidden text-tertiary space-y-0 px-2">
                <LockIcon className="w-4 h-4" />
                <FormControl>
                  <Input
                    className="border-none placeholder:text-tertiary text-tertiary"
                    placeholder="请再次输入密码"
                    {...field}
                    type="password"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="flex items-center bg-[#dcdcdc] border-none rounded-sm overflow-hidden text-tertiary space-y-0 px-2">
                <RectangleEllipsisIcon className="w-4 h-4 flex-shrink-0" />
                <FormControl>
                  <Input
                    className="border-none placeholder:text-tertiary text-tertiary"
                    placeholder="请输入验证码"
                    {...field}
                  />
                </FormControl>
                {time ? (
                  <CountDownSpan onEnd={() => setTime(undefined)} />
                ) : (
                  <Button
                    variant="icon"
                    loading={sendCode.isPending}
                    onClick={() => sendCode.mutate()}
                    type="button"
                    className="text-primary !mt-0 mr-0 text-xs"
                  >
                    获取验证码
                  </Button>
                )}
              </FormItem>
            )}
          />

          <div className="!mt-6">
            {props.type === 'register' ? (
              <FormItem className="flex items-center space-y-0">
                <JknCheckbox checked={checked} onClick={toggle} className="text-xs" />
                &nbsp;
                <span className="text-xs text-secondary">我已阅读并接受《服务条款》</span>
              </FormItem>
            ) : null}
            <Button className="mt-2" block loading={register.isPending}>
              {props.type === 'register' ? '注册' : '重置密码'}
            </Button>
          </div>
        </form>
        <div
          className="text-xs text-center mt-4 text-secondary cursor-pointer"
          onClick={() => props.setPage('login')}
          onKeyDown={() => {}}
        >
          账号密码登录
        </div>
      </Form>
    </div>
  )
}

const CountDownSpan = ({ onEnd }: { onEnd: () => void }) => {
  const [count] = useCountDown({
    leftTime: 60 * 1000,
    onEnd
  })

  return <span className="text-primary text-xs whitespace-nowrap cursor-pointer">剩余{Math.round(count / 1000)}秒</span>
}

export default LoginModal
