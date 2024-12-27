import { login } from "@/api"
import WechatLoginIcon from '@/assets/icon/wechat_login.png'
import LoginLeftImg from '@/assets/image/login_left.png'
import AppleIcon from '@/assets/icon/apple.png'
import GoogleIcon from '@/assets/icon/google.png'
import { useToken, useUser } from "@/store"
import { z } from "zod"
import { Button, Form, FormControl, FormField, FormItem,  Input } from "@/components"
import { useToast, useZForm } from "@/hooks"
import { useMutation } from "@tanstack/react-query"

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
        <div className="px-4 other-login mt-4" >
          {/* <Divider >其他登录方式</Divider> */}
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
  return (
    <div className="apple-login w-8 h-8 cursor-pointer">
      <img src={AppleIcon} alt="" className="w-full h-full" />
    </div>
  )
}

const WeChatLogin = () => {
  return (
    <div className="wechat-login w-10 h-10 cursor-pointer">
      <img src={WechatLoginIcon} alt="" className="w-full h-full" />
    </div>
  )
}

const GoogleLogin = () => {
  return (
    <div className="google-login w-8 h-8 cursor-pointer">
      <img src={GoogleIcon} alt="" className="w-full h-full" />
    </div>
  )
}

export default LoginForm