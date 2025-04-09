import {
  bindInviteCode,
  forgotPassword,
  getUser,
  login,
  loginByThird,
  loginImService,
  type registerByEmail,
  sendEmailCode
} from '@/api'
import {
  Button,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  JknIcon
} from '@/components'
import { useToast, useZForm } from '@/hooks'
import { useToken } from '@/store'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCountDown, useCounter } from 'ahooks'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { useState } from 'react'
import { FormProvider, type SubmitErrorHandler } from 'react-hook-form'
import { z } from 'zod'
import { AppleLogin, GoogleLogin, WeChatLogin } from './login-other'
import dayjs from 'dayjs'

const resetFormSchema = z
  .object({
    username: z.string().email({ message: '请输入正确的邮箱格式' }),
    password: z.string().min(6, { message: '最少输入6位密码' }).max(50),
    passwordConfirm: z.string(),
    inv: z.string().optional(),
    code: z.string()
  })
  .refine(data => data.password === data.passwordConfirm, { message: '两次密码输入不一致' })

type RegisterSchema = z.infer<typeof resetFormSchema>

export const ResetForm = (props: {
  afterLogin(): unknown
  setPage: (page: 'login' | 'register' | 'resetPassword') => void
}) => {
  const form = useZForm(resetFormSchema, { username: '', password: '', passwordConfirm: '', code: '', inv: '' })
  const [time, setTime] = useState<number | undefined>()
  const [step, { inc: nextStep, dec: prevStep }] = useCounter(1)
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

  const onNext = async () => {
    if (step === 1) {
      sendCode.mutate()
    } else {
      nextStep()
    }
  }

  const onPrev = async () => {
    if (step === 1) {
      props.setPage('login')
    } else {
      prevStep()
    }
  }

  const register = useMutation({
    mutationFn: async (data: RegisterSchema) => {
      const valid = await form.trigger()
      if (!valid) {
        throw new Error('请检查输入')
      }
      const r: Parameters<typeof registerByEmail>[0] = {
        username: data.username,
        password: data.password,
        password_confirm: data.passwordConfirm,
        code: data.code
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

  return (
    <>
      {step !== 0 ? (
        <div className="w-[960px] mx-auto pt-[60px]">
          <div className="flex items-center" onClick={onPrev} onKeyDown={() => {}}>
            <div className="size-8 rounded bg-accent flex items-center justify-center mr-2">
              <JknIcon.Svg name="arrow-left" size={10} className="" />
            </div>
            <span>返回</span>
          </div>
          <div className="h-full w-[371px] pt-[80px] box-border flex flex-col leading-none text-foreground mx-auto">
            <p className="text-[32px] mb-16">
              {step === 1 ? (
                <>
                  <span>找回密码</span>
                  <br />
                  <span className="mt-3 text-base text-tertiary">&nbsp;</span>
                </>
              ) : null}
              {step === 2 ? (
                <>
                  <span>输入邮箱验证码</span>
                  <br />
                  <span className="mt-3 text-base text-tertiary">验证码已发送至{form.getValues('username')}</span>
                </>
              ) : null}
              {step === 3 ? (
                <>
                  <span>设置新密码</span>
                  <br />
                  <span className="mt-3 text-base text-tertiary">&nbsp;</span>
                </>
              ) : null}
            </p>
            <FormProvider {...form}>
              <form className="space-y-6" onSubmit={form.handleSubmit(() => sendCode.mutate(), onError)}>
                {step === 1 ? (
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
                ) : null}
                {step === 2 ? (
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="">
                        <FormControl>
                          <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} {...field} className="w-full">
                            <InputOTPGroup className="justify-between space-x-6">
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        <FormMessage className="text-sm text-destructive" />
                      </FormItem>
                    )}
                  />
                ) : null}

                {step === 3 ? (
                  <>
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
                  </>
                ) : null}
              </form>
            </FormProvider>
            {step === 1 ? (
              <Button className="mt-10" onClick={() => onNext()} block size="xl" loading={sendCode.isPending}>
                下一步
              </Button>
            ) : step === 2 ? (
              <div className="text-center">
                <Button className="mb-4 mt-16" size="xl" onClick={() => onNext()} block>
                  下一步
                </Button>
                <span className="text-sm">
                  收不到验证码？
                  <span
                    className="text-tertiary cursor-pointer"
                    onClick={() => !time && sendCode.mutate()}
                    onKeyDown={() => {}}
                  >
                    重发
                    {time ? (
                      <span>
                        (<CountDownSpan onEnd={() => setTime(undefined)} />
                        )s
                      </span>
                    ) : null}
                  </span>
                </span>
              </div>
            ) : step === 3 ? (
              <Button
                className="mt-10"
                onClick={() => register.mutate(form.getValues())}
                block
                size="xl"
                loading={register.isPending}
              >
                确定
              </Button>
            ) : null}
            {step !== 2 ? (
              <>
                <div className="flex text-secondary justify-center space-x-4 mt-4 text-sm">
                  <div className="text-center">
                    还没有账号？
                    <span
                      className="cursor-pointer text-primary"
                      onClick={() => props.setPage('register')}
                      onKeyDown={() => {}}
                    >
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
              </>
            ) : null}
          </div>
        </div>
      ) : null}
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
