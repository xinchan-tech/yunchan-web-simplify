import { logout } from "@/api"
import { getUser, updateUser } from "@/api/user"
import UserDefaultPng from '@/assets/icon/user_default.png'
import { Button, FormControl, FormField, FormItem, FormLabel, Input, JknAvatar } from "@/components"
import { useFormModal } from "@/components/modal"
import { useToast, useZForm } from "@/hooks"
import { useToken, useUser } from "@/store"
import { useQuery } from "@tanstack/react-query"
import { useRequest } from "ahooks"
import to from "await-to-js"
import dayjs from "dayjs"
import { useMemo } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

interface UserCenterProps {
  onLogout: () => void
}

const userFormSchema = z.object({
  realname: z.string().optional(),
  avatar: z.string().optional()
})


const UserCenter = (props: UserCenterProps) => {
  const form = useZForm(userFormSchema, { realname: '', avatar: '' })
  const { user, setUser, reset } = useUser()
  const { removeToken } = useToken()
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: [getUser.cacheKey],
    queryFn: () => getUser({
      extends: ['authorized']
    })
  })


  const logoutQuery = useRequest(logout, { manual: true })
  const { toast } = useToast()
  const authorized = useMemo(() => {
    return query.data?.authorized[0]
  }, [query.data])

  const edit = useFormModal({
    form,
    title: t('userEdit.nickname'),
    content: <UserEditForm />,
    onOk: async (values: UserEditForm) => {
      const [err] = await to(updateUser(values))

      if (err) {
        toast({
          description: err.message
        })
        return
      }

      const r = await query.refetch()

      setUser({ ...r.data })

      edit.close()
    },
    onOpen: () => {
      form.setValue('realname', query.data?.realname)
      form.setValue('avatar', query.data?.avatar)
    }
  })

  const onLogout = async () => {
    const [err] = await to(logoutQuery.runAsync())

    if (err) {
      toast({
        description: err.message
      })
      return
    }

    reset()
    removeToken()
    props.onLogout()
    if(window.location.pathname !== '/'){
      window.location.href = '/'
    }
  }

  return (
    <div >
      <div className="p-4 text-sm">
        <div className="text-base mb-2">{t('base info')}</div>
        <div className="border-0 border-b border-solid border-b-gray-7" />
        <div className="flex my-2">
          <div className="w-1/2 cell-group">
            <div>
              <div>{t('nickname')}：</div><div>{user?.realname}</div>
              <span className="text-sm text-gray-5 cursor-pointer" onClick={() => edit.open()} onKeyDown={() => { }}>&emsp;{t('edit')}</span>
            </div>
            <div className="py-2">
              <div>{t('avatar')}：</div>
              <div>
                <JknAvatar src={user?.avatar} fallback={UserDefaultPng} />
              </div>
              <span className="text-sm text-gray-5 cursor-pointer">&emsp;&nbsp;&nbsp;{t('edit')}</span>
            </div>
            <div><div>{t('user')}ID：</div><div>{user?.username}</div></div>
          </div>
          <div className="w-1/2 cell-group">
            <div><div>{t('current packages')}：</div></div>
            <div><div>{t('package name')}：</div><div>{authorized?.name}</div></div>
            <div><div>{t('expiration date')}：</div><div>{authorized?.expire_time ? dayjs(+authorized.expire_time * 1000).format('YYYY-MM-DD') : '-'}</div></div>
          </div>
        </div>
        <div className="text-right" onClick={onLogout} onKeyDown={() => { }}>
          <Button variant="outline">退出登录</Button>
        </div>
        {
          edit.context
        }
        <style jsx>
          {`
          .cell-group > div{
            display: flex;
            margin: 4px 0;
            align-items: center;
          }

          .cell-group > div > div:first-child{
            width: 70px;
            text-align: right;;
          }
        `}
        </style>
      </div>
    </div>
  )
}

type UserEditForm = {
  nickname?: string
}

const UserEditForm = () => {
  const { t } = useTranslation()
  const form = useFormContext()
  return (
    <div className="p-4">
      <FormField control={form.control} name="realname"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('nickname')}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField control={form.control} name="avatar"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('avatar')}</FormLabel>
            <FormControl>
              <Input  {...field}  />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  )
}

export default UserCenter