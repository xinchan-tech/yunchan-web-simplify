import { bindInviteCode, forgotPassword, getUser, login, loginByThird, loginImService, type registerByEmail, sendEmailCode } from "@/api"
import { Button, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Input, InputOTP, InputOTPGroup, InputOTPSlot, JknIcon } from "@/components"
import { useToast, useZForm } from "@/hooks"
import { useToken } from "@/store"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useCountDown, useCounter } from "ahooks"
import { REGEXP_ONLY_DIGITS, } from "input-otp"
import { useState } from "react"
import { FormProvider, type SubmitErrorHandler } from "react-hook-form"
import { z } from "zod"
import { AppleLogin, GoogleLogin, WeChatLogin } from "./login-other"
import dayjs from "dayjs"

const resetFormSchema = z
  .object({
    username: z.string().email({ message: '请输入正确的邮箱格式' }),
    password: z.string().min(6, { message: '最少输入6位密码' }).max(50),
    passwordConfirm: z.string(),
    inv: z.string().optional(),
    code: z.string().optional()
  })
  .refine(data => data.password === data.passwordConfirm, { message: '两次密码输入不一致' })

type RegisterSchema = z.infer<typeof resetFormSchema>

export const ResetForm = (props: {
  afterLogin(): unknown
  setPage: (page: 'login' | 'register' | 'resetPassword') => void
}) => {
  const form = useZForm(resetFormSchema, { username: '', password: '', passwordConfirm: '', code: '', inv: '' })
  const [time, setTime] = useState<number | undefined>()
  const [inv, setInv] = useState(false)
  const [step, { inc: nextStep, dec: prevStep }] = useCounter(1)
  const [code, setCode] = useState('')
  const setToken = useToken(s => s.setToken)
  const { toast } = useToast()
  const queryClient = useQueryClient()



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

      await sendEmailCode(form.getValues('username'), 'forgot')
    },
    onSuccess: () => {
      toast({
        description: '验证码已发送'
      })
      setTime(60 * 1000)
      if (step < 2) {
        nextStep()
      }
    },
    onError: e => {
      toast({
        description: e.message
      })
    }
  })

  const register = useMutation({
    mutationFn: (data: RegisterSchema) => {
      if (!code) {
        throw new Error('请输入验证码')
      }

      const r: Parameters<typeof registerByEmail>[0] = {
        username: data.username,
        password: data.password,
        password_confirm: data.passwordConfirm,
        code: code
      }

      return forgotPassword(r)
    },
    onSuccess: () => {
      toast({
        description: '重置密码成功'
      })
      props.setPage('login')
    },
    onError: e => {
      toast({
        description: e.message
      })
    }
  })

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


  const loginMutation = useMutation({
    mutationFn: ({ type, data }: { type: string; data: any }) => {
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
      {
        step === 1 ? (
          <div className="w-[960px] mx-auto pt-[60px]">
            <div className="flex items-center" onClick={() => props.setPage('login')} onKeyDown={() => { }}>
              <div className="size-8 rounded bg-accent flex items-center justify-center mr-2">
                <JknIcon.Svg name="arrow-left" size={10} className="" />
              </div>
              <span>返回</span>
            </div>
            <div className="h-full w-[371px] pt-[80px] box-border flex flex-col leading-none text-foreground mx-auto">
              <p className="text-[32px] mb-16">
                <span>找回密码</span><br />
              </p>
              <div>
                <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={code} onChange={v => setCode(v)} className="w-full">
                  <InputOTPGroup className="justify-between space-x-6">
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
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
          </div>
        ) : null
      }
      {
        step >= 2 ? (
          <div className="w-[960px] mx-auto pt-[60px]">
            <div className="flex items-center" onClick={() => prevStep()} onKeyDown={() => { }}>
              <div className="size-8 rounded bg-accent flex items-center justify-center mr-2">
                <JknIcon.Svg name="arrow-left" size={10} className="" />
              </div>
              <span>返回</span>
            </div>
            <div className="h-full w-[371px] pt-[80px] box-border flex flex-col leading-none text-foreground mx-auto">
              <p className="text-[32px] mb-16">
                <span>输入邮箱验证码</span><br />
                <span className="mt-3 text-base text-tertiary">验证码已发送至{form.getValues('username')}</span>
              </p>
              <div>
                <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={code} onChange={v => setCode(v)} className="w-full">
                  <InputOTPGroup className="justify-between space-x-6">
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div className="text-center">
                <Button className="mb-4 mt-16" size="xl" loading={register.isPending} onClick={() => register.mutate(form.getValues())} block>确定</Button>
                <span className="text-sm">收不到验证码？<span className="text-tertiary cursor-pointer" onClick={() => !time && sendCode.mutate()} onKeyDown={() => { }}>
                  重发
                  {
                    time ? (
                      <span>(<CountDownSpan onEnd={() => setTime(undefined)} />)s</span>
                    ) : null
                  }
                </span></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-[140px] h-full w-[371px] box-border flex flex-col leading-none text-foreground">
            <p className="text-[32px] mb-16">
              <span>创建账号</span><br />
              <span className="mt-3 text-base text-tertiary">请输入您用于注册的邮箱地址</span>
            </p>
            <FormProvider {...form}>
              <form className="space-y-6" onSubmit={form.handleSubmit(() => sendCode.mutate(), onError)}>
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="">
                      <FormLabel className="text-base text-foreground">邮箱</FormLabel>
                      <FormControl>
                        <Input
                          showError
                          size="lg"
                          className="border-border placeholder:text-tertiary"
                          placeholder="请输入邮箱"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-sm text-destructive" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="">
                      <FormLabel className="text-base text-foreground">密码</FormLabel>
                      <FormControl>
                        <Input
                          size="lg"
                          showError
                          className="border-border placeholder:text-tertiary"
                          placeholder="请输入密码"
                          {...field}
                          type="password"
                        />
                      </FormControl>
                      <FormDescription className="text-sm text-tertiary">密码长度至少6位</FormDescription>
                      <FormMessage className="text-sm text-destructive" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passwordConfirm"
                  render={({ field }) => (
                    <FormItem className="">
                      <FormLabel className="text-base text-foreground">确认密码</FormLabel>
                      <FormControl>
                        <Input
                          size="lg"
                          className="border-border placeholder:text-tertiary"
                          placeholder="请再次输入密码"
                          {...field}
                          type="password"
                        />
                      </FormControl>
                      <FormMessage className="text-sm text-destructive" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inv"
                  render={({ field }) => (
                    <FormItem className="">
                      <FormLabel className="text-base flex items-center text-foreground cursor-pointer" onClick={() => setInv(s => !s)}>
                        邀请码(选填)
                        <JknIcon.Svg name="arrow-down" className="size-3 ml-auto mt-1" />
                      </FormLabel>
                      {
                        inv ? (
                          <FormControl>
                            <Input
                              size="lg"
                              className="border-border placeholder:text-tertiary"
                              placeholder="请输入邀请码"
                              {...field}
                            />
                          </FormControl>
                        ) : null
                      }
                    </FormItem>
                  )}
                />

                <div className="!mt-10">
                  <Button className="mt-4" block loading={sendCode.isPending}>
                    下一步
                  </Button>
                </div>
              </form>
              <div className="flex text-secondary justify-center space-x-4 mt-4 text-sm">
                <div className="text-center">
                  已有账户？
                  <span className="cursor-pointer text-primary" onClick={() => props.setPage('login')} onKeyDown={() => { }}>
                    立即登录
                  </span>
                </div>
              </div>
            </FormProvider>
          </div>
        )
      }
    </>
  )
}

const CountDownSpan = ({ onEnd }: { onEnd: () => void }) => {
  const [count] = useCountDown({
    leftTime: 60 * 1000,
    onEnd
  })

  return <span className="">{Math.round(count / 1000)}</span>
}