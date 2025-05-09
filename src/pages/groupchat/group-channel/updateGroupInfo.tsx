import { type EditGroupPayload, editGroupService, getChannelDetail, getChannelMembers } from '@/api'
import { useQuery } from '@tanstack/react-query'

import { JknAlert, Textarea, useModal } from '@/components'
import { JknIcon } from '@/components'
import FullScreenLoading from '@/components/loading'
import { useToast } from '@/hooks'
import { useUser } from '@/store'
import { useGroupChatShortStore, useGroupChatStoreNew } from '@/store/group-chat-new'
import copy from 'copy-to-clipboard'
import { useEffect, useRef, useState } from 'react'
import WKSDK, { type Channel } from 'wukongimjssdk'
import AliyunOssUploader from '../components/aliyun-oss-uploader'
import ChatAvatar from '../components/chat-avatar'
import { GroupTag } from '../components/create-and-join-group/group-channel-card'

const UpdateGroupInfo = (props: {
  group: Channel
  total?: number
  onSuccess?: (params: EditGroupPayload) => void
}) => {
  const options = {
    queryFn: () => {
      return getChannelDetail(props.group.channelID)
    },
    queryKey: [getChannelDetail.cacheKey]
  }
  const queryDetail = useQuery(options)
  const [previewAvatar, setPreviewAvatar] = useState('')
  const shareUrl = useUser(s => s.user?.share_url)
  const groipMemberOptions = {
    queryFn: () => {
      return getChannelMembers(props.group.channelID, props.total)
    },
    queryKey: [getChannelMembers.cacheKey]
  }
  const { toast } = useToast()
  const memberDetail = useQuery(groipMemberOptions)

  useEffect(() => {
    if (queryDetail.data) {
      setPreviewAvatar(queryDetail.data.avatar)
    }
  }, [queryDetail.data])

  const getPrice = () => {
    let price = ''
    if (queryDetail.data && Array.isArray(queryDetail.data.products) && queryDetail.data.products.length > 0) {
      const product = queryDetail.data.products[0]
      price = `$${product.price}/${product.unit}`
    }
    return price
  }
  const { selectedChannel } = useGroupChatStoreNew()
  const { getGroupDetailData } = useGroupChatShortStore()
  const editTypeRef = useRef('')

  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const submitEdit = (params: EditGroupPayload, isAvatar?: boolean) => {
    setIsSaving(true)
    editGroupService(params)
      .then(() => {
        if (!isAvatar) {
          editModal.modal.close()
          queryDetail.refetch()
        } else if (params.avatar) {
          setPreviewAvatar(params.avatar)
        }
        toast({
          description: '修改成功'
        })
        if (props.group.channelID === selectedChannel?.channelID) {
          getGroupDetailData(props.group.channelID)
        }
        typeof props.onSuccess === 'function' && props.onSuccess(params)
        notifyChannelUpdate()
      })
      .finally(() => {
        setIsSaving(false)
      })
  }

  const confirmEdit = () => {
    const params: EditGroupPayload = {
      account: props.group.channelID
    }
    switch (editTypeRef.current) {
      case 'tag':
        params.tags = editValue
        break

      case 'brief':
        params.brief = editValue
        break
      case 'notice':
        params.notice = editValue
        break
      default:
        break
    }
    submitEdit(params)
  }

  const getEditTitle = () => {
    switch (editTypeRef.current) {
      case 'tag':
        return '修改群标签'

      case 'brief':
        return '修改群简介'
      case 'notice':
        return '修改群公告'
      default:
        break
    }
  }

  const confirmEditAvatar = (url: string) => {
    editTypeRef.current = ''
    const params: EditGroupPayload = {
      account: props.group.channelID,
      avatar: url
    }
    submitEdit(params, true)
  }

  const notifyChannelUpdate = () => {
    WKSDK.shared().config.provider.syncConversationsCallback()
  }

  const editModal = useModal({
    content: (
      <div className="p-4">
        <div className="border-dialog-border rounded-sm  flex bg-accent w-full">
          <Textarea
            value={editValue}
            onChange={e => {
              setEditValue(e.target.value)
            }}
            className="border-none placeholder:text-tertiary flex-1 resize-none"
            placeholder={`请输入${getEditTitle()}`}
          />
        </div>
      </div>
    ),
    closeIcon: false,
    className: 'w-[500px]',
    confirmLoading: isSaving,
    onOk: confirmEdit,
    title: getEditTitle()
  })

  const handleEdit = (type: 'tag' | 'brief' | 'notice') => {
    editTypeRef.current = type
    switch (type) {
      case 'tag':
        setEditValue(queryDetail.data?.tags || '')
        break
      case 'brief':
        setEditValue(queryDetail.data?.brief || '')
        break
      case 'notice':
        setEditValue(queryDetail.data?.notice || '')
        break
      default:
        break
    }
    editModal.modal.open()
  }

  return (
    <div className="relative p-4 h-[590px]">
      {editModal.context}
      {queryDetail.isFetching === true && <FullScreenLoading />}
      <div className="top-area mb-4">
        <div className="flex justify-center">
          <AliyunOssUploader
            loading={isSaving}
            disabled={!queryDetail.data?.editable}
            className="w-20 h-20"
            value={previewAvatar}
            onChange={url => {
              confirmEditAvatar(url)
            }}
          />
        </div>
        <div className="text-center mt-2 text-lg">{queryDetail.data?.name || '--'}</div>
        <div className="flex justify-center mt-2">
          <GroupTag total={queryDetail.data?.total_user} showMember tags={queryDetail.data?.tags || ''} />
          {queryDetail.data?.editable === true && (
            <JknIcon
              name="edit"
              onClick={() => {
                handleEdit('tag')
              }}
            />
          )}
        </div>
        <div className="flex justify-center mt-2 text-sm text-gray-500">
          {queryDetail.data?.brief}
          {queryDetail.data?.editable === true && (
            <JknIcon
              name="edit"
              onClick={() => {
                handleEdit('brief')
              }}
            />
          )}
        </div>
        <div className="flex white-line-gap mt-6">
          <div className="flex-1 text-center leading-[50px]">人数上限：{queryDetail.data?.max_num || '--'}人</div>
          <div className="flex items-center w-[420px] box-border px-1 py-2.5">
            <span>邀请链接</span>
            <span className="ml-auto w-[200px] line-clamp-1 text-tertiary">{shareUrl}</span>
            <JknIcon.Svg
              name="copy"
              className="text-tertiary cursor-pointer"
              size={20}
              onClick={() => {
                if (shareUrl) {
                  copy(`${shareUrl}&cid=${props.group.channelID}`)
                  JknAlert.success('复制成功')
                }
              }}
            />
          </div>
        </div>
      </div>
      <div className="bottom-area flex pl-5 pr-5 justify-between">
        <div className="notice mt-8">
          <div className="text-sm flex items-center">
            群公告{' '}
            {queryDetail.data?.editable === true && (
              <JknIcon
                name="edit"
                onClick={() => {
                  handleEdit('notice')
                }}
              />
            )}
          </div>
          <div className="w-[300px] h-[200px] mt-2 p-3 notice-content text-sm">{queryDetail.data?.notice || '--'}</div>
        </div>
        <div className="members">
          <div className="text-sm">全部成员</div>
          <div className="w-[200px] h-[280px] members-scroll mt-2">
            {memberDetail.data?.items.map(member => {
              return (
                <div className="flex member-item items-center h-[34px] pl-2" key={member.uid}>
                  <ChatAvatar
                    data={{
                      name: member.realname,
                      avatar: member.avatar,
                      uid: member.username
                    }}
                    className="w-6 h-6"
                  />
                  <div className="ml-2 text-sm max-w-[150px]">{member.realname}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <style jsx>{`
         {
          .white-line-gap {
            border-top: 1px solid #383838;
            height: 50px;
            border-bottom: 1px solid #383838;
          }
          .member-item:hover {
            background-color: rgb(39, 40, 43);
          }
          .notice-content {
            background-color: rgb(30, 30, 30);
            border-radius: 3px;
          }
          .members-scroll {
            border: 1px solid #383838;
            border-radius: 4px;
            overflow-y: auto;
          }
        }
      `}</style>
    </div>
  )
}
export default UpdateGroupInfo
