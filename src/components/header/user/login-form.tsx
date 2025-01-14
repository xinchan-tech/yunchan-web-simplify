import { getWxLoginStatus, login } from "@/api"
import WechatLoginIcon from '@/assets/icon/wechat_login.png'
import LoginLeftImg from '@/assets/image/login_left.png'
import AppleIcon from '@/assets/icon/apple.png'
import GoogleIcon from '@/assets/icon/google.png'
import { useToken, useUser } from "@/store"
import { z } from "zod"
import { Button, Form, FormControl, FormField, FormItem, Input, useModal } from "@/components"
import { useToast, useZForm } from "@/hooks"
import { useMutation } from "@tanstack/react-query"
import { useMount, useUnmount } from "ahooks"
import { useRef } from "react"
import { uid } from "radash"
import QRCode from 'qrcode'

interface LoginFormProps {
  afterLogin?: () => void
  onClose?: () => void
}

const loginSchema = z.object({
  mobile: z.string().min(2).max(50),
  password: z.string().min(6).max(50)
})

type LoginForm = z.infer<typeof loginSchema>

const LoginForm = (props: LoginFormProps) => {
  const form = useZForm(loginSchema, { mobile: '', password: '' })
  const { setUser } = useUser()
  const { setToken } = useToken()
  const { toast } = useToast()

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (res) => {
      setUser(res.user)
      setToken(res.token)
      props.afterLogin?.()
    },
    onError: (err) => {
      toast({
        description: err.message,
      })
    }
  })

  return (
    <div className="flex login-form">
      <div className="w-[380px] h-[400px] relative">
        <div className="absolute left-0 top-0 w-8 h-8 cursor-pointer" onClick={() => props.onClose?.()} onKeyUp={() => { }} />
        <img src={LoginLeftImg} alt="" className="w-full h-full" />
      </div>
      <div className="bg-white h-[400px] w-[280px] box-border flex flex-col px-4">
        <p className="text-[#3861F6] mt-12 text-lg">登录账号</p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(loginMutation.mutate as any)} className="space-y-4">
            <FormField control={form.control} name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input className="bg-[#dcdcdc] border-none placeholder:text-tertiary text-tertiary" placeholder="请输入账号" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField control={form.control} name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input className="bg-[#dcdcdc] border-none placeholder:text-tertiary text-tertiary" placeholder="请输入密码" {...field} type="password" />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button block loading={loginMutation.isPending}>登录</Button>
          </form>
        </Form>
        <div className="px-4 other-login mt-12" >
          <div className="flex items-center mb-2">
            <span className="border-0 border-b border-solid border-gray-300 flex-1" />
            <span className="text-secondary mx-2 text-xs">其他登录方式</span>
            <span className="border-0 border-b border-solid border-gray-300 flex-1" />
          </div>
          <div className="flex items-center justify-between px-10">
            <AppleLogin />
            <WeChatLogin />
            <GoogleLogin />
          </div>
        </div>
      </div>
    </div>
  )
}

const AppleLogin = () => {
  useMount(() => {
    window.AppleID.auth.init({
      clientId: 'com.jkn.app.web',
      redirectURI: 'https://us.mgjkn.com/login/auto',
      scope: 'email',
      state: 'https://www.mgjkn.com/main',
      nonce: 'xxx',
      usePopup: true,
    })
  })

  const onClick = () => {
    window.AppleID.auth.signIn()
  }

  return (
    <div className="apple-login w-6 h-6 cursor-pointer" onClick={onClick} onKeyUp={() => { }}>
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
    className: 'w-[640px]',
  })

  return (
    <div className="wechat-login w-8 h-8 cursor-pointer" onClick={modal.modal.open} onKeyUp={() => { }}>
      <img src={WechatLoginIcon} alt="" className="w-full h-full" />
      {
        modal.context
      }
    </div>
  )
}

const GoogleLogin = () => {
  useMount(() => {
    window.google.accounts.id.initialize({
      client_id: '1084914910896-skncl8a34m47fe8toeak808pvrdn18vr.apps.googleusercontent.com',
      context: 'signin',
      ux_mode: 'popup',
      login_uri: "https://us.mgjkn.com/login/auto",
    })

    window.google.accounts.id.renderButton(document.getElementById('google-login'), {
      theme: 'outline',
      type: 'icon',
      size: 'medium',
      text: 'filled_black',
      shape: 'circle'
    })
  })
  return (
    <div className="google-login cursor-pointer relative overflow-hidden w-6 h-6">
      <div id="google-login" className="opacity-0 w-full h-full" />
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
      margin: 2,
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
      getWxLoginStatus(sid).then((res) => {
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

export default LoginForm