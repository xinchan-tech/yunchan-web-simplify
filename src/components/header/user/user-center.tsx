import { bindInviteCode, logout } from "@/api"
import { getUser, updateUser } from "@/api/user"
import UserDefaultPng from '@/assets/icon/user_default.png'
import { Button, FormControl, FormField, FormItem, FormLabel, Input, JknAlert, JknAvatar, Popover, PopoverContent, PopoverTrigger, Separator } from "@/components"
import { useFormModal, useModal } from "@/components/modal"
import { useToast, useZForm } from "@/hooks"
import { useToken, useUser } from "@/store"
import { uploadUtils } from "@/utils/oss"
import { parsePermission } from "@/utils/util"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useRequest, useUnmount } from "ahooks"
import to from "await-to-js"
import copy from 'copy-to-clipboard'
import { useEffect, useMemo, useRef, useState } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

interface UserCenterProps {
  onLogout: () => void
}

const userFormSchema = z.object({
  realname: z.string().optional()
})


const UserCenter = (props: UserCenterProps) => {
  const form = useZForm(userFormSchema, { realname: '' })
  const user = useUser(s => s.user)
  const setUser = useUser(s => s.setUser)
  const reset = useUser(s => s.reset)
  const removeToken = useToken(s => s.removeToken)

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

  useEffect(() => {
    if (query.data) {
      setUser({ ...query.data, permission: parsePermission(query.data.permission) })
    }
  }, [query.data, setUser])

  const edit = useFormModal({
    form,
    title: t('userEdit.nickname'),
    content: <UserEditForm />,
    className: 'w-[400px]',
    onOk: async (values: UserEditForm) => {
      const [err] = await to(updateUser(values))

      if (err) {
        toast({
          description: err.message
        })
        return
      }

      query.refetch()
      edit.close()
    },
    onOpen: () => {
      form.setValue('realname', query.data?.realname)
    }
  })

  const onLogout = async () => {
    JknAlert.confirm({
      title: '退出登录',
      content: '确定要退出登录吗？',
      onAction: async (status) => {
        if (status === 'confirm') {
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
          if (window.location.pathname !== '/') {
            window.location.href = '/'
          }
        }
      }
    })
    // const [err] = await to(logoutQuery.runAsync())

    // if (err) {
    //   toast({
    //     description: err.message
    //   })
    //   return
    // }

    // reset()
    // removeToken()
    // props.onLogout()
    // if (window.location.pathname !== '/') {
    //   window.location.href = '/'
    // }
  }
  const [inviteCode, setInviteCode] = useState("")

  const bindInviteCodeMutation = useMutation({
    mutationFn: async (closeCb: () => void) => {
      await bindInviteCode(inviteCode)
      closeCb()
    },
    onSuccess: () => {
      toast({
        description: '加群成功'
      })
    },
    onError: (err) => {
      if (err?.message) {
        toast({
          description: err.message
        })
      }
    }
  })

  const avatarForm = useModal({
    content: <AvatarSelect onOk={() => { avatarForm.modal.close(); query.refetch() }} />,
    title: '更改头像',
    className: 'w-[400px]',
    closeIcon: true,
    footer: null
  })

  return (
    <div >
      <div className="p-4 text-sm">
        <div className="text-base mb-2 flex items-center">
          <span>{t('base info')}</span>
          {
            (user?.show_invite === 1) ? (
              <Popover>
                <PopoverTrigger asChild>
                  <span className="cursor-pointer text-primary ml-auto text-sm" >{t('inputInviteCode')}</span>
                </PopoverTrigger>
                <PopoverContent className="w-[200px]">
                  {
                    (action) => (
                      <div className="py-2 px-4 text-center space-y-4">
                        <div className="text-sm text-center">邀请码</div>
                        <Input className="w-full border-transparent bg-accent placeholder:text-tertiary" placeholder="请输入邀请码" value={inviteCode} size="sm"
                          onChange={(e) => {
                            setInviteCode(e.target.value)
                          }} />
                        <Button loading={bindInviteCodeMutation.isPending} className="mt-2 px-6" size="sm" onClick={() => bindInviteCodeMutation.mutate(action.close)}>确定</Button>
                      </div>
                    )
                  }
                </PopoverContent>
              </Popover>
            ) : null
          }

        </div>
        <div className="border-0 border-b border-solid border-b-gray-7" />
        <div className="flex my-2">
          <div className="w-1/2 cell-group !space-y-4">
            <div>
              <div>{t('nickname')}：</div><div>{user?.realname}</div>
              <span className="text-xs text-tertiary text-gray-5 cursor-pointer" onClick={() => edit.open()} onKeyDown={() => { }}>&emsp;{t('edit')}</span>
            </div>
            <div className="py-2">
              <div>{t('avatar')}：</div>
              <div>
                <JknAvatar className="w-12 h-12" src={user?.avatar} fallback={UserDefaultPng} />
              </div>
              <span className="text-xs text-tertiary text-gray-5 cursor-pointer" onClick={avatarForm.modal.open} onKeyDown={() => { }}>&emsp;&nbsp;&nbsp;{t('edit')}</span>
            </div>


          </div>
          <div className="w-1/2 cell-group !space-y-4">
            <div >
              <div>{t('user')}ID：</div><div>{user?.username}</div>
            </div>
            <div><div>{t('package name')}：</div><div>{authorized?.name}</div></div>
            {/* <div><div>{t('expiration date')}：</div><div>{authorized?.expire_time ? dayjs(+authorized.expire_time * 1000).format('YYYY-MM-DD') : '-'}</div></div> */}
          </div>
        </div>

        <div className="text-base mb-2 flex items-center">
          <span>积分信息</span>
        </div>
        <div className="border-0 border-b border-solid border-b-gray-7 mb-3" />
        <div className="flex my-2">
          <div className="flex items-center">
            <div>{t('inviteCode')}：</div>
            <div className="bg-accent rounded-sm px-4 py-0.5">
              {user?.re_code}
            </div>
            <span className="ml-4 text-primary cursor-pointer" onKeyDown={() => { }} onClick={() => {
              if (user?.share_url) {
                copy(user.share_url)
                toast({
                  description: '复制成功'
                })
              }
            }}>复制分享链接</span>
          </div>
        </div>
        <div className="flex justify-center items-center my-6">
          <div className="text-center w-28">
            <div className="text-sm text-tertiary mb-3">累计转化</div>
            <div className="text-4xl font-bold">{user?.total_inv}</div>
          </div>
          <div className="text-center w-28">
            <div className="text-sm text-tertiary mb-3">累计点击</div>
            <div className="text-4xl font-bold">{user?.total_points}</div>
          </div>
          <Separator orientation="vertical" className="h-16 bg-accent mx-4" />
          <div className="text-center w-28">
            <div className="text-sm text-tertiary mb-3">当前积分</div>
            <div className="text-4xl font-bold">{user?.points}</div>
          </div>
        </div>


        <div className="text-right" onClick={onLogout} onKeyDown={() => { }}>
          <Button variant="outline" className="border-border">退出登录</Button>
        </div>
        {
          edit.context
        }
        {
          avatarForm.context
        }
        <style jsx>
          {`
          .cell-group > div{
            display: flex;
            margin: 4px 0;
            align-items: center;
          }

          .cell-group > div > div:first-child{
            width: 90px;
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
    </div>
  )
}

const AvatarSelect = (props: { onOk: () => void }) => {
  const user = useUser(s => s.user)
  const [avatar, setAvatar] = useState<string>(user?.avatar || UserDefaultPng)
  const fileRef = useRef<File>()

  const inputRef = useRef<HTMLInputElement>(null)

  const onImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      setAvatar(e.target?.result as string)
      fileRef.current = file
    }

    reader.readAsDataURL(file)
  }

  useUnmount(() => {
    fileRef.current = undefined
  })

  const upload = useMutation({
    mutationFn: async () => {
      if (!fileRef.current) return
      const f = fileRef.current
      const fileUrl = await uploadUtils.upload(f, f.name)


      return updateUser({ avatar: fileUrl.url })
    },
    onSuccess: () => {
      props.onOk()
    }
  })

  return (
    <div className="p-4">
      <div className="w-full flex flex-col items-center justify-center">
        <JknAvatar className="w-56 h-56 my-4" src={avatar} fallback={UserDefaultPng} />
        <div>
          <input type="file" ref={inputRef} hidden accept="image/*" onChange={onImageSelect} />
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>选择图片</Button>
        </div>
      </div>
      <div className="mt-6 mb-2 flex items-center justify-center">
        <Button variant="outline" className="mr-2">取消</Button>
        <Button onClick={() => upload.mutate()} loading={upload.isPending}>确定</Button>
      </div>
    </div>
  )
}

export default UserCenter