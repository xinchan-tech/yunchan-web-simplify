import { useState } from "react"
import { LoginForm } from "./login"
import { RegisterForm } from "./register"
import { ResetForm } from "./reset"
import { useNavigate } from "react-router"

const LoginPage = () => {
  const [page, setPage] = useState<'login' | 'register' | 'resetPassword'>('login')
  const navigate = useNavigate()
  const onNav = () => {
    navigate('/')
  }
  return (
    <div className="bg-background w-full h-full rounded-xs">
      <div className="mx-auto w-fit">
        {{
          login: <LoginForm setPage={setPage} afterLogin={onNav} />,
          register: <RegisterForm setPage={setPage} />,
          resetPassword: <ResetForm setPage={setPage} afterLogin={onNav} />,
        }[page] ?? <LoginForm setPage={setPage} afterLogin={onNav} />
        }
      </div>
    </div>
  )
}

export default LoginPage