import { getUser, updateUser } from '@/api'
import UserDefaultPng from '@/assets/icon/user_default.png'
import {
  Button,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Input,
  JknAlert,
  JknAvatar,
  JknIcon,
  Separator,
  useFormModal,
  useModal
} from '@/components'
import { useToast, useZForm } from '@/hooks'
import { parseUserPermission, useUser } from '@/store'
import { uploadUtils } from '@/utils/oss'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useUnmount } from 'ahooks'
import to from 'await-to-js'
import copy from 'copy-to-clipboard'
import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import { useShallow } from 'zustand/react/shallow'

const userFormSchema = z.object({
  realname: z.string().optional()
})

const UserCenter = () => {
  const form = useZForm(userFormSchema, { realname: '' })
  const user = useUser(
    useShallow(s => ({
      name: s.user?.realname,
      avatar: s.user?.avatar,
      id: s.user?.username,
      account: s.user?.email,
      flow_num: s.user?.flow_num,
      total_inv: s.user?.total_inv,
      transaction: s.user?.transaction,
      points: s.user?.points,
      shareUrl: s.user?.share_url
    }))
  )
  const setUser = useUser(s => s.setUser)

  const { t } = useTranslation()
  const query = useQuery({
    queryKey: [getUser.cacheKey],
    queryFn: () =>
      getUser({
        extends: ['authorized']
      })
  })

  useEffect(() => {
    if (query.data) {
      setUser({ ...query.data, permission: parseUserPermission(query.data.permission) })
    }
  }, [query.data, setUser])

  const { toast } = useToast()

  const authorized = useUser(s => s.user?.authorized)

  const packages = useMemo(() => {
    if (!authorized?.length) return

    const pkg = authorized.find(pkg => pkg.expire_time && +pkg.expire_time > +Date.now().toString().slice(-3))

    if (!pkg) return

    return {
      name: pkg.name,
      expireTime: pkg.expire_time
    }
  }, [authorized])

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

  const avatarForm = useModal({
    content: (
      <AvatarSelect
        onOk={() => {
          avatarForm.modal.close()
          query.refetch()
        }}
      />
    ),
    title: '更改头像',
    className: 'w-[400px]',
    closeIcon: true,
    footer: null
  })

  const navigate = useNavigate()

  return (
    <div>
      <div className="flex items-center space-x-4">
        <div className="size-[80px] relative">
          <JknAvatar title={user.name} src={user.avatar} className="size-full" />
          <div
            className="bg-background border border-solid border-[#50535E] size-6 absolute right-0 bottom-0 rounded-full flex items-center justify-center cursor-pointer"
            onClick={avatarForm.modal.open}
            onKeyDown={() => {}}
          >
            <JknIcon.Svg name="edit" size={12} className="text-[#50535E]" />
          </div>
        </div>
        <span className="text-xl">{user.account}</span>
      </div>

      <div className="mt-10 bg-muted rounded px-5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center text-[#E7C88D]">
              <JknIcon name="vip" className="size-6 " />
              &nbsp;&nbsp;
              {packages?.name ?? '未购买版本'}
            </div>
            <div className="text-secondary mt-2">
              {packages?.expireTime ? `有效期至${dayjs(+packages.expireTime * 1000).format('YYYY-MM-DD')}` : '--'}
            </div>
          </div>
          <div
            className="bg-[#E8D9B9] rounded-[30px] text-[#6A4C18] w-[120px] h-[36px] leading-[36px] text-center cursor-pointer"
            onClick={() => navigate('/app/mall')}
            onKeyDown={() => {}}
          >
            {packages ? '立即续费' : '立即购买'}
          </div>
        </div>
        <Separator orientation="horizontal" className="my-3 bg-[#3D3D3D]" />
        <div className="flex items-center space-x-12">
          <div className="text-center">
            <div className="text-xl leading-none font-bold">{user?.flow_num}</div>
            <div className="text-sm text-[#808080] mt-1">点击</div>
          </div>
          <div className="text-center">
            <div className="text-xl leading-none font-bold">{user?.total_inv}</div>
            <div className="text-sm text-[#808080] mt-1">注册</div>
          </div>
          <div className="text-center">
            <div className="text-xl leading-none font-bold">{user?.transaction}</div>
            <div className="text-sm text-[#808080] mt-1">转化</div>
          </div>
          <div className="text-center">
            <div className="text-xl leading-none font-bold">{user?.points}</div>
            <div className="text-sm text-[#808080] mt-1">当前积分</div>
          </div>
        </div>
      </div>
      <div className="space-y-12 mt-12">
        <div className="flex items-center">
          <span className="text-lg">昵称</span>
          <div className="ml-auto text-[#808080]">
            {user.name}
            <Button className="bg-accent text-foreground rounded w-[72px] ml-5" onClick={() => edit.open()}>
              编辑
            </Button>
          </div>
        </div>

        <div className="flex items-center">
          <span className="text-lg">UID</span>
          <div className="ml-auto text-[#808080]">
            {user.id}
            <Button
              className="bg-accent text-foreground rounded w-[72px] ml-5"
              onClick={() => {
                if (user?.id) {
                  copy(user.id)
                  JknAlert.success('复制成功')
                }
              }}
            >
              复制
            </Button>
          </div>
        </div>

        <div className="flex items-center">
          <span className="text-lg">账单明细</span>
          <div className="ml-auto text-[#808080]">
            <Button className="bg-accent text-foreground rounded w-[72px] ml-5" onClick={() => navigate('/app/user/bills')}>
              查看
            </Button>
          </div>
        </div>

        <div className="flex items-center">
          <span className="text-lg">邀请好友</span>
          <div className="ml-auto text-[#808080]">
            <Button
              className="bg-accent text-foreground rounded w-[72px] ml-5"
              onClick={() => navigate('/app/user/invite')}
            >
              前往
            </Button>
          </div>
        </div>

        <div className="flex items-center">
          <span className="text-lg">订阅管理</span>
          <div className="ml-auto text-[#808080]">
            <Button
              className="bg-accent text-foreground rounded w-[72px] ml-5"
              onClick={() => navigate('/app/user/subscribe')}
            >
              前往
            </Button>
          </div>
        </div>
      </div>
      {edit.context}
      {avatarForm.context}
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
      <FormField
        control={form.control}
        name="realname"
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

    reader.onload = e => {
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
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            选择图片
          </Button>
        </div>
      </div>
      <div className="mt-6 mb-2 flex items-center justify-center">
        <Button variant="outline" className="mr-2">
          取消
        </Button>
        <Button onClick={() => upload.mutate()} loading={upload.isPending}>
          确定
        </Button>
      </div>
    </div>
  )
}

export default UserCenter
