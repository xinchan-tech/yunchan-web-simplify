import { useState } from "react"
import { LoginForm } from "./login"
import { RegisterForm } from "./register"
import { ResetForm } from "./reset"

const LoginPage = () => {
  const [page, setPage] = useState<'login' | 'register' | 'resetPassword'>('login')
  return (
    <div className="bg-background w-full h-full rounded-xs">
      <div className="mx-auto w-fit">
        {{
          login: <LoginForm setPage={setPage} />,
          register: <RegisterForm setPage={setPage} />,
          resetPassword: <ResetForm setPage={setPage} afterLogin={() => {}} />,
        }[page] ?? <LoginForm setPage={setPage} />
        }
      </div>
    </div>
  )
}

export default LoginPage