import Menu1 from '@/assets/icon/left_menu_1@2x.png'
import Menu2 from '@/assets/icon/left_menu_2@2x.png'
import Menu3 from '@/assets/icon/left_menu_3@2x.png'
import Menu4 from '@/assets/icon/left_menu_4@2x.png'
import Menu5 from '@/assets/icon/left_menu_5@2x.png'
import Menu6 from '@/assets/icon/left_menu_6@2x.png'
import Menu8 from '@/assets/icon/left_menu_8@2x.png'
import Menu10 from '@/assets/icon/left_menu_10@2x.png'
import { router } from "@/router"
import { navWithAuth } from "@/utils/nav"

const Menu = () => {
  const menus = [
    {
      icon: Menu1,
      title: '首页',
      path: '/',
    },
    {
      icon: Menu2,
      title: '行情浏览',
      path: '/stock',
    },
    {
      icon: Menu3,
      title: '股票金池',
      path: '/stock',
    },
    {
      icon: Menu4,
      title: '超级选股',
      path: '/stock',
    },
    {
      icon: Menu5,
      title: 'AI 报警',
      path: '/stock',
    },
    {
      icon: Menu10,
      title: '股票日历',
      path: '/stock',
    },
    {
      icon: Menu8,
      title: '消息中心',
      path: '/stock',
    },
    {
      icon: Menu6,
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
        <div key={item.title} onClick={() => onNav(item.path)} onKeyDown={() => {}} className="mb-4 flex flex-col items-center">
          <img src={item.icon} className="inline-block w-6 h-6 mb-1" alt="" />
          <div className="w-8 text-center text-sm text-[#555555]">{item.title}</div>
        </div>
      ))}
    </div>
  )
}

export default Menu
