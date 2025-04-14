import { useState } from 'react'
import { LoginForm } from './login'
import { RegisterForm } from './register'
import { ResetForm } from './reset'
import { useQueryParams } from '@/hooks'
import './login.scss'

const LoginPage = () => {
  const [page, setPage] = useState<'login' | 'register' | 'resetPassword'>('login')
  const [params] = useQueryParams<{ redirect?: string }>()
  const onNav = () => {
    window.location.href = params.redirect || '/'
  }
  return (
    <div className="bg-background w-full h-full rounded-xs overflow-y-auto">
      <div className="mx-auto w-fit relative login-container">
        {{
          login: <LoginForm setPage={setPage} afterLogin={onNav} />,
          register: <RegisterForm setPage={setPage} />,
          resetPassword: <ResetForm setPage={setPage} afterLogin={onNav} />
        }[page] ?? <LoginForm setPage={setPage} afterLogin={onNav} />}
      </div>
    </div>
  )
}

export default LoginPage
