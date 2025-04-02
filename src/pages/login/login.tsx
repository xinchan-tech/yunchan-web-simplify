import {
  bindInviteCode,
  getUser,
  login,
  loginByThird,
  loginImService
} from '@/api'
import { Button, Form, FormControl, FormField, FormItem, FormLabel, Input } from '@/components'
import { useToast, useZForm } from '@/hooks'
import { useToken } from '@/store'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { z } from 'zod'
import { AppleLogin, GoogleLogin, WeChatLogin } from "./login-other"

interface LoginFormProps {
  afterLogin?: () => void
  onClose?: () => void
}

const loginSchema = z.object({
  mobile: z.string().min(2).max(50),
  password: z.string().min(6).max(50)
})

type LoginForm = z.infer<typeof loginSchema>


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
      <div className="pt-[140px] h-full w-[371px] box-border flex flex-col">
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
          <div className="flex items-center justify-between px-20 mt-6">
            <AppleLogin onLogin={data => loginMutation.mutate({ type: 'apple', data })} />
            <WeChatLogin />
            <GoogleLogin onLogin={data => loginMutation.mutate({ type: 'google', data })} />
          </div>
        </div>
      </div>
    </>
  )
}

