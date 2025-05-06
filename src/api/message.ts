import request from '@/utils/request'

type GetNoticeTypesResult = {
  id: string
  name: string
  avatar: string
  describe: string
  create_time: string
  unread: number
}

/**
 * 通知分类列表
 */
export const getNoticeTypes = () => {
  return request.get<GetNoticeTypesResult[]>('/notice/types').then(r => r.data)
}
getNoticeTypes.cacheKey = 'notice:types'

/**
 * 通知消息列表
 */
export const getNoticeList = (noticeId: string) => {
  return request
    .get<
      PageResult<{
        id: string
        img: string
        is_read: string
        scheme: string
        create_time: string
        content: string
        title: string
      }>
    >('/notices', { params: { notice_cate_id: noticeId } })
    .then(r => r.data)
}
getNoticeList.cacheKey = 'notice:list'

interface GetChatContactsResult {
  uid: string
  message: string
  create_time: string
  unread: string
  username: string
  avatar: string | null
}

export const getChatContacts = () => {
  return request.get<GetChatContactsResult[]>('/chat/contacts').then(r => r.data)
}
getChatContacts.cacheKey = 'chat:contacts'

type GetChatRecordsResult = {
  from_user: {
    id: string
    username: string
    avatar: string | null
  }
  id: string
  group_id: string
  /**
   * 0: 文本消息
   * 1: 图片消息
   * 2: 图文消息
   */
  type: '0' | '1' | '2'
  message: string
  is_read: string
  create_time: string
}

/**
 * 聊天记录
 */
export const getChatRecords = (params: { uid: string; limit: number; page: 1 }) => {
  return request.get<{ items: GetChatRecordsResult[] }>('/chats', { params }).then(r => r.data)
}
getChatRecords.cacheKey = 'chat:records'

/**
 * 标记消息已读
 */
export const markAsRead = (cateId: string) => {
  return request.post<void>('/chat/setIsRead', { uid: cateId }).then(r => r.data)
}

/**
 * 标记系统已读
 */
export const markSystemAsRead = (cateId: string) => {
  return request.post<void>('/notice/log/setIsRead', { notice_cate_id: cateId }, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).then(r => r.data)
}
