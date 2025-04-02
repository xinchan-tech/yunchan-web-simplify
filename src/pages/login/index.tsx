import { useState } from "react"
import { LoginForm } from "./login"
import { RegisterForm } from "./register"

const LoginPage = () => {
  const [page, setPage] = useState<'login' | 'register' | 'resetPassword'>('register')
  return (
    <div className="bg-background w-full h-full rounded-xs">
      <div className="mx-auto pt-[140px] w-fit">
        {{
          login: <LoginForm setPage={setPage} />,
          register: <RegisterForm setPage={setPage} type="register" />,
          resetPassword: 123
        }[page] ?? <LoginForm setPage={setPage} />
        }
      </div>
    </div>
  )
}

export default LoginPage