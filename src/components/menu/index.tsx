import { navWithAuth } from "@/utils/nav"
import JknIcon from "../jkn/jkn-icon"
import { cn } from "@/utils/style"
import { router } from "@/router"

type MenuItem = {
  icon: IconName
  title: string
  path: string
}


const Menu = () => {
  const pathname = router.state.location.pathname
  const menus: MenuItem[] = [
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
      path:  '/super'
    },
    {
      icon: 'left_menu_5@2x',
      title: 'AI 报警',
      path: '/stock',
    },
    {
      icon: 'left_menu_6@2x',
      title: '股票日历',
      path: '/stock',
    },
    {
      icon: 'left_menu_7@2x',
      title: '消息中心',
      path: '/stock',
    },
    {
      icon: 'left_menu_8@2x',
      title: '大V喊单',
      path: '/stock',
    }
  ]

  const onNav = (path: string) => {
    navWithAuth(path)
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

export default Menu
