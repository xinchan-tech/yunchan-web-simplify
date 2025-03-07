import {
  bindInviteCode,
  type forbiddenServicePyload,
  getGroupChannels,
  joinGroupByInviteCode,
  setGroupManagerService,
  type setManagerServicePayload,
  setMemberForbiddenService,
} from "@/api"
import { Button, ContextMenuContent, ContextMenuItem, Input } from "@/components"
import { useModal } from "@/components"
import { useToast } from "@/hooks"
import { useUser } from "@/store"
import { useGroupChatShortStore } from "@/store/group-chat-new"
import { useLatest } from "ahooks"
import to from "await-to-js"
import { throttle } from "radash"
import { useContext, useEffect, useRef, useState } from "react"
import type { Subscriber } from "wukongimjssdk"
import { GroupChatContext } from ".."


export const useMemberSetting = () => {
  const { user } = useUser()
  const { toast } = useToast()
  const { syncSubscriber, handleReply } = useContext(GroupChatContext)
  const subscribers = useGroupChatShortStore((state) => state.subscribers)
  const conversationWraps = useGroupChatShortStore(
    (state) => state.conversationWraps
  )

  const groupDetailData = useGroupChatShortStore(
    (state) => state.groupDetailData
  )
  const judgeSetManagerAuth = (member: Subscriber) => {
    return (
      user &&
      groupDetailData &&
      user.username === groupDetailData.owner &&
      member.orgData?.type !== "2"
    )
  }

  const handleSetManager = async (item: Subscriber) => {
    if (groupDetailData) {
      const data: setManagerServicePayload = {
        channelId: groupDetailData.account,
        username: item.uid,
        type: "1",
      }
      if (item.orgData.type === "1") {
        data.type = "0"
      }
      try {
        const resp = await setGroupManagerService(data)
        if (resp && resp.status === 1) {
          toast({
            description:
              data.type === "1" ? "设置管理员操作成功" : "取消管理员操作成功",
          })
          // 同步一下群成员
          if (conversationWraps && conversationWraps.length > 0) {
            const currenntChannel = conversationWraps.find(
              (item) => item.channel.channelID === groupDetailData.account
            )
            if (currenntChannel) {
              typeof syncSubscriber === "function" &&
                syncSubscriber(currenntChannel.channel)
            }
          }
        }
      } catch (err: Error) {
        if (err?.message) {
          toast({ description: err.message })
        }
      }
    }
  }

  const handleLahei = async (item: Subscriber) => {
    if (groupDetailData) {
      const data: forbiddenServicePyload = {
        channelId: groupDetailData.account,
        uids: [item.uid],
        forbidden: "0",
      }

      if (item.orgData.forbidden === "0") {
        data.forbidden = "1"
        if (item.orgData.type === "1") {
          toast({ description: "请先取消对方管理员权限再拉黑" })
          return
        }
      }
      try {
        const resp = await setMemberForbiddenService(data)

        if (resp) {
          if (resp.status === 1) {
            toast({
              description:
                data.forbidden === "1" ? "禁言操作成功" : "取消禁言操作成功",
            })
          }
        }
      } catch (err: Error) {
        if (err?.message) {
          toast({ description: err.message })
        }
      }
    }
  }

  const judgeHasLaheiAuth = (member: Subscriber) => {
    // 拉黑不了群主
    if (member.orgData.type === "2") {
      return
    }
    const self = subscribers.find((item) => item.uid === user?.username)
    if (self) {
      return self.orgData.type === "1" || self.orgData.type === "2"
    }
  }

  const renderContextMenu = (item: Subscriber) => {
    return (
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => {
            handleReply({ quickReplyUserId: item.uid })
          }}
        >
          回复用户
        </ContextMenuItem>
        {judgeSetManagerAuth(item) && (
          <ContextMenuItem
            onClick={() => {
              handleSetManager(item)
            }}
          >
            {item.orgData.type === "1" ? "取消管理员" : "设为管理员"}
          </ContextMenuItem>
        )}
        {judgeHasLaheiAuth(item) === true && (
          <ContextMenuItem
            onClick={() => {
              handleLahei(item)
            }}
          >
            {item.orgData?.forbidden === "0" ? "添加黑名单" : "解除黑名单"}
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    )
  }

  return { renderContextMenu }
}

export const useScrollToBottomOnArrowClick = (
  targetRef: React.RefObject<HTMLElement>
) => {
  const arrowRef = useRef<HTMLDivElement | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const unreadCountRef = useLatest(unreadCount)

  const renderTip = (num: number) => {
    return `<div class='flex h-8 items-center rounded-full pl-4 pr-4 text-white' style="background-color: rgba(0,0,0,0.4)">&#9660;&nbsp;有${num}条未读消息<div>`
  }

  useEffect(() => {
    const targetElement = targetRef.current
    if (!targetElement) return

    // 创建向下箭头元素
    const arrow = document.createElement("div")
    arrow.style.position = "absolute"
    arrow.style.bottom = "10px"
    arrow.style.right = "10px"
    arrow.style.zIndex = "99"
    arrow.style.cursor = "pointer"
    arrow.innerHTML = renderTip(unreadCount) // 向下箭头符号
    arrow.style.display = "none" // 初始时隐藏箭头

    targetElement.appendChild(arrow)
    arrowRef.current = arrow

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = targetElement
      const distanceToBottom = scrollHeight - scrollTop - clientHeight
      if (distanceToBottom < 100) {
        arrow.style.display = "none"
      }

      // 当滚动到底部时，重置未读消息计数
      if (distanceToBottom === 0) {
        setUnreadCount(0)
      }
    }
    const goodScroll = throttle({ interval: 200 }, handleScroll)

    const handleArrowClick = () => {
      if (targetElement) {
        targetElement.scrollTop = targetElement.scrollHeight
        setUnreadCount(0)
      }
    }

    targetElement.addEventListener("scroll", goodScroll)
    arrow.addEventListener("click", handleArrowClick)

    return () => {
      if (arrowRef.current) {
        arrowRef.current.removeEventListener("click", handleArrowClick)
        if (targetElement.contains(arrowRef.current)) {
          targetElement.removeChild(arrowRef.current)
        }
      }
      targetElement.removeEventListener("scroll", goodScroll)
    }
  }, [targetRef])

  useEffect(() => {
    try {
      if (arrowRef.current && targetRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = targetRef.current
        const distanceToBottom = scrollHeight - scrollTop - clientHeight
        if (unreadCount > 0 && distanceToBottom >= 200) {
          arrowRef.current.style.display = "block"
        }
      }
    } catch (er) { }
  }, [unreadCount])

  // 提供一个函数用于增加未读消息计数
  const incrementUnreadCount = () => {
    setUnreadCount((prevCount) => {
      const newCount = prevCount + 1
      if (arrowRef.current) {
        arrowRef.current.innerHTML = renderTip(newCount)
      }
      return newCount
    })
  }

  return { incrementUnreadCount }
}


export const useJoinGroupByInviteCode = (options?: {
  showTip: boolean,
  onSuccess: () => void
}) => {
  const [inviteCode, setInviteCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const { toast } = useToast()
  const { showTip = true, onSuccess } = options || {}
  const handleInviteToGroup = async () => {
    if (inviteCode) {
      setIsJoining(true)
      const [err] = await to(joinGroupByInviteCode({ channel_id: inviteCode, type: '1' }))

      setIsJoining(false)

      if (err) {
        toast({
          description: err.message
        })
        return
      }

      toast({
        description: '加群成功'
      })
      setInviteCode('')
      inviteToGroupModal.modal.close()

      // bindInviteCode(inviteCode)
      //   .then(r => {
      //     if (r.data === true) {
      //       return getGroupChannels({
      //         type: '1',
      //         re_code: inviteCode
      //       })
      //     }
      //   }).then(data => {
      //     if(Array.isArray(data) && data.length > 0) {
      //       const channel_id = data[0].account
      //       const params: {
      //         channel_id: string
      //         type: '1' | '2'
      //       } = {
      //         channel_id,
      //         type: '1'
      //       }

      //       return joinGroupByInviteCode(params)
      //     } 
      //     return Promise.resolve([])
      //   })
      //   .then(r => {
      //     if (r?.status === 1) {
      //       toast({
      //         description: '加群成功'
      //       })
      //       typeof onSuccess === 'function' && onSuccess()
      //     }
      //   })
      //   .catch(er => {
      //     if (er?.message) {
      //       toast({
      //         description: er.message
      //       })
      //     }
      //   })
      //   .finally(() => {
      //     setInviteCode('')
      //     inviteToGroupModal.modal.close()
      //     setIsJoining(false)
      //   })
    }else{
      toast({
        description: '请输入群号'
      })
    }
  }
  const inviteToGroupModal = useModal({
    content: (
      <div className="flex items-center justify-center pl-2 pr-2 flex-col pt-5 pb-5">
        {
          showTip === true && (
            <div className="text-sm mb-4">
              您购买了套餐，尚未加入交流群，请联系主播获取群号，填写之后加入交流群
            </div>
          )
        }

        <div className={'border-dialog-border rounded-sm  bg-accent inline-block'}>
          <Input
            className="border-none placeholder:text-tertiary flex-1"
            value={inviteCode}
            onChange={e => {
              setInviteCode(e.target.value)
            }}
            style={{ marginTop: '0' }}
            placeholder="请输入邀请码"
          />
        </div>
        <Button
          className="mt-5"
          loading={isJoining}
          onClick={() => {
            handleInviteToGroup()
          }}
        >
          确定
        </Button>
      </div>
    ),
    footer: false,
    title: '输入邀请码加群',
    className: 'w-[600px]',
    closeIcon: true
  })

  return {
    contenxt: inviteToGroupModal.context,
    open: inviteToGroupModal.modal.open,
    close: inviteToGroupModal.modal.close

  }
}