import { JknIcon } from "@/components"
import { routes } from "@/router"
import { Fragment, useMemo, useState } from "react"
import { Link, Outlet, useLocation } from "react-router"

const UserPage = () => {
  const { pathname } = useLocation()

  const title = useMemo(() => {
    if (pathname === '/user') return ['个人中心']
    const subPath = pathname.split('/')[2]

    const route = routes
      .find(r => r.path === '/')?.children!.find(r => (r.path === '/user'))?.children?.find(r => r.path === subPath)

    return ['个人中心', route?.handle?.title]
  }, [pathname])
  return (
    <div className="w-full h-full overflow-y-auto bg-background leading-none text-foreground">
      <div className="w-page mx-auto mt-10">
        {
          title.length === 1 ? (
            <h3 className="text-[32px]">个人中心</h3>
          ) : (
            <div className="space-x-2 flex items-center mb-10">
              {
                title.map((item, index) => (
                  <Fragment key={item}>
                    {
                      index === title.length - 1 ? (
                        <span className="">
                          {item}
                        </span>
                      ) : (
                        <Link to={'/user'}>{item}</Link>
                      )
                    }
                    {
                      index === title.length - 1 ? null : (
                        <JknIcon.Svg name="arrow-right" size={10} />)
                    }
                  </Fragment>
                ))
              }
            </div>
          )
        }
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default UserPage