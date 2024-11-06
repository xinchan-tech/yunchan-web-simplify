import { logout } from "@/api"
import { getUser, updateUser } from "@/api/user"
import UserDefaultPng from '@/assets/icon/user_default.png'
import { Avatar, Button, JknAvatar } from "@/components"
import { useFormModal } from "@/components/modal"
import { useToast } from "@/hooks"
import { useToken, useUser } from "@/store"
import { useMount, useRequest } from "ahooks"
import to from "await-to-js"
import dayjs from "dayjs"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

interface UserCenterProps {
  onLogout: () => void
}

const UserCenter = (props: UserCenterProps) => {
  const { user, setUser, reset } = useUser()
  const { removeToken } = useToken()
  const { t } = useTranslation()
  const query = useRequest(getUser, { defaultParams: [{ extends: ['authorized'] }] })
  const logoutQuery = useRequest(logout, { manual: true })
  const { toast } = useToast()
  const authorized = useMemo(() => {
    return query.data?.authorized[0]
  }, [query.data])

  const edit = useFormModal({
    title: t('userEdit.nickname'),
    content: <UserEditForm />,
    width: 320,
    onOk: async (values: UserEditForm) => {
      const [err] = await to(updateUser(values))

      if (err) {
        toast({
          description: err.message
        })
        return
      }

      const r = await query.refreshAsync()

      setUser({ ...r })

      edit.close()
    },
    onOpen: () => {
      edit.setFieldsValue({
        realname: query.data?.realname,
        avatar: query.data?.avatar
      })
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
  }

  return (
    <div >
      <div className="p-4">
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
          <Button>退出登录</Button>
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

  return (
    <div className="p-4">
      {/* <Form.Item name="realname" rules={[{ required: true, message: t('nickname_required') }]} label={t('nickname')}>
        <Input />
      </Form.Item> */}
      {/* <Form.Item name="avatar" label={t('avatar')}>
        <Upload listType="picture-card" maxCount={1} />
      </Form.Item> */}
    </div>
  )
}

export default UserCenter