import { login } from "@/api"
import WechatLoginIcon from '@/assets/icon/wechat_login.png'
import LoginLeftImg from '@/assets/image/login_left.png'
import AppleIcon from '@/assets/icon/apple.png'
import GoogleIcon from '@/assets/icon/google.png'
import { useToken, useUser } from "@/store"
import { LockOutlined, UserOutlined } from "@ant-design/icons"
import { useRequest } from "ahooks"
import { Button, Divider, Form, Input, message } from "antd"
import to from "await-to-js"

type LoginForm = {
  mobile: string
  password: string
}

interface LoginFormProps {
  afterLogin?: () => void
  onClose?: () => void
}

const LoginForm = (props: LoginFormProps) => {
  const [form] = Form.useForm<LoginForm>()
  const {setUser} = useUser()
  const {setToken} = useToken()
  const submitLogin = useRequest(login, { manual: true })
  const onLogin = async (values: LoginForm) => {
    const [err, res] = await to(submitLogin.runAsync(values))

    if (err) {
      message.error(err.message)
      return
    }

    if(res){
      setUser(res.user)
      setToken(res.token)
    }

    props.afterLogin?.()
  }

  return (
    <div className="flex login-form">
      <div className="w-[380px] h-[400px] relative">
        <div className="absolute left-0 top-0 w-8 h-8 cursor-pointer" onClick={() => props.onClose?.()} onKeyUp={() => {}}  />
        <img src={LoginLeftImg} alt="" className="w-full h-full" />
      </div>
      <div className="bg-white h-[400px] w-[280px] box-border flex flex-col px-4">
        <p className="text-[#3861F6] mt-12 text-lg">登录账号</p>
        <Form form={form} onFinish={onLogin}>
          <Form.Item name="mobile">
            <Input size="large" prefix={<UserOutlined />} placeholder="请输入账号" />
          </Form.Item>
          <Form.Item name="password">
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>
          <Button type="primary" block size="large" htmlType="submit" loading={submitLogin.loading}>登录</Button>
        </Form>
        <div className="px-4 other-login mt-4" >
          <Divider >其他登录方式</Divider>
          <div className="flex items-center justify-between px-10">
            <AppleLogin />
            <WeChatLogin />
            <GoogleLogin />
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .login-form :global(.ant-input-outlined){
            --text-color: #7d7d7d;
            --bg-color: #dcdcdc;
            background-color: var(--bg-color);
            color: var(--text-color);
            border-color: var(--bg-color);
          }

          .login-form :global(.ant-input) {
            color: #000;
          }

          .login-form :global(.ant-input::-webkit-input-placeholder){
            color: var(--text-color);
          }

          .login-form :global(.ant-btn){
            background-color: #3156f5;
          }

          .login-form :global(.ant-btn:hover){
            background-color: #4e7fff;
          }

          .other-login :global(.ant-divider-inner-text){
            color: #dcdcdc !important;
            font-size: 12px;
            font-weight: normal;
          }

          .other-login :global(.ant-divider){
            border-block-start: 0 rgba(0, 0, 0, 0.1);
          }
        `}
      </style>
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