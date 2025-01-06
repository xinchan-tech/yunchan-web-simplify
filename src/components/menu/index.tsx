import { JknIcon } from "../jkn/jkn-icon"
import { cn } from "@/utils/style"
import { router } from "@/router"
import { type ReactNode, useEffect, useMemo, useState } from "react"
import { Settings } from "lucide-react"
import { useToken } from "@/store"
import { useToast } from "@/hooks"

type MenuItem = {
  icon: IconName | ReactNode
  title: string
  path: string
}


const Menu = () => {
  const [pathname, setPathname] = useState(router.state.location.pathname)
  const { token } = useToken()
  const { toast } = useToast()

  useEffect(() => {
    const s = router.subscribe((s) => {
      setPathname(s.location.pathname)
    })

    return () => {
      s()
    }
  }, [])

  const menus: MenuItem[] = useMemo(() => [
    {
      icon: 'left_menu_1@2x',
      title: '首页',
      path: '/',
    },
    {
      icon: 'left_menu_2@2x',
      title: '行情浏览',
      path: '/views',
    },
    {
      icon: 'left_menu_3@2x',
      title: '股票金池',
      path: '/golden',
    },
    {
      icon: 'left_menu_4@2x',
      title: '超级选股',
      path: '/super'
    },
    {
      icon: 'left_menu_5@2x',
      title: 'AI报警',
      path: '/alarm',
    },
    {
      icon: 'left_menu_6@2x',
      title: '股票日历',
      path: '/calendar',
    },
    {
      icon: 'left_menu_7@2x',
      title: '消息中心',
      path: '/message',
    },
    {
      icon: 'left_menu_8@2x',
      title: '大V快评',
      path: '/shout',
    },
    {
      icon: <Settings className="text-[#3c3c3c]" />,
      title: '设置',
      path: '/setting'
    }
  ], [])



  const onNav = (path: string) => {
    if (!token && path !== '/') {
      toast({
        title: '请先登录'
      })
      return
    }

    return router.navigate(path)
  }


  // return router.navigate(...args)
  return (
    <div className="h-full flex flex-col items-center">
      {menus.map((item) => (
        <div key={item.title} onClick={() => onNav(item.path)} onKeyDown={() => { }}
          className={cn(
            'mb-4 flex flex-col items-center cursor-pointer',
            item.title === '设置' ? 'mt-auto' : ''
          )}
        >
          <div className={cn(pathname === item.path && 'active-icon')}>
            {
              typeof item.icon === 'string' ? (
                <JknIcon name={item.icon as IconName} className="w-6 h-6" />
              ) : (
                item.icon
              )
            }
          </div>
          <div className={
            cn(
              'w-8 text-center text-sm text-[#555555]',
              pathname === item.path && 'active-text'
            )
          }>{item.title}</div>
        </div>
      ))}
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
  )
}

export default Menu
