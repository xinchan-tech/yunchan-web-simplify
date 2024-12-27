import JknIcon from "../jkn/jkn-icon"
import { cn } from "@/utils/style"
import { router } from "@/router"
import { useEffect, useState } from "react"
import { useToken } from "@/store"
import { useToast } from "@/hooks"

type MenuItem = {
  icon: IconName
  title: string
  path: string
}


const MenuRight = () => {
  const [pathname, setPathname] = useState(router.state.location.pathname)

  useEffect(() => {
    const s = router.subscribe((s) => {
      setPathname(s.location.pathname)
    })

    return () => {
      s()
    }
  }, [])

  const menus: MenuItem[] = [
    {
      icon: 'right_menu_1',
      title: '个股盘口',
      path: '/stock/s',
    },
    {
      icon: 'right_menu_4',
      title: '财务估值',
      path: '/stock/finance'
    }
  ]

  const { token } = useToken()
  const { toast } = useToast()

  const onNav = (path: string) => {
    if (!token && path !== '/') {
      toast({
        title: '请先登录'
      })
      return
    }

    const search = new URLSearchParams(window.location.search)
    const symbol = search.get('symbol') ?? 'QQQ'

    if(path.startsWith('/stock')){
      router.navigate(`${path}?symbol=${symbol}`)
    }else{
      router.navigate(path)
    }
  }

  return (
    <div>
      {menus.map((item) => (
        <div key={item.title} onClick={() => onNav(item.path)} onKeyDown={() => { }} className="mb-4 flex flex-col items-center cursor-pointer">
          <div className={cn(pathname === item.path && 'active-icon')}>
            <JknIcon name={item.icon}
              className="inline-block w-7 h-7 mb-1"
            />
          </div>
          <div className={
            cn(
              'w-8 text-center text-sm text-[#555555]',
              pathname === item.path && 'active-text'
            )
          }>{item.title}</div>
          <style jsx>{
            `
            {
              .active-icon {
                filter: invert(50%) sepia(96%) saturate(6798%) hue-rotate(227deg) brightness(99%) contrast(94%);
              }

              .active-text {
                color: hsl(var(--primary))
              }
            }`
          }</style>
        </div>
      ))}
    </div>
  )
}

export default MenuRight
