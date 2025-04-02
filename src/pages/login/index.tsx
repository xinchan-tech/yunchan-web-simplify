import { useState } from "react"
import { LoginForm } from "./login"

const LoginPage = () => {
  const [page, setPage] = useState<'login' | 'register' | 'resetPassword'>()
  return (
    <div className="bg-background w-full h-full rounded-xs">
      <div className="mx-auto pt-[140px] w-fit">
        <LoginForm setPage={setPage} />
      </div>
    </div>
  )
}

export default LoginPage