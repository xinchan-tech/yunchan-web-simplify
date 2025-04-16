import { HoverCard, HoverCardContent, HoverCardTrigger, JknAlert, JknIcon } from '@/components'
import { useToast } from '@/hooks'
import { useUser } from '@/store'
import copy from 'copy-to-clipboard'

const Invite = () => {
  const shareUrl = useUser(s => s.user?.share_url)
  const reCode = useUser(s => s.user?.re_code)

  return (
    <div className="h-full overflow-hidden flex flex-col text-white">
      <div className="text-[32px] leading-[44px]">
        邀请好友
        <br />
        即可<span className="text-[#d8ff9e]">获得积分奖励</span>
      </div>
      <div className="mt-4">积分可用于购买会员</div>

      <div className="mt-10">
        <HoverCard>
          <HoverCardTrigger>
            <div className="inline-block text-xl border-0 border-b border-solid border-white cursor-pointer">
              邀请规则
            </div>
          </HoverCardTrigger>
          <HoverCardContent side="right">推荐用户，首次购买金额的20%转换为积分</HoverCardContent>
        </HoverCard>
      </div>

      <div className="text-foreground mt-10 space-y-2.5">
        <div className="bg-[#151515] flex items-center w-[420px] box-border px-1 py-2.5">
          <span>邀请码</span>
          <span className="ml-auto line-clamp-1 text-tertiary mr-2">{reCode}</span>
          <JknIcon.Svg
            name="copy"
            className="text-tertiary cursor-pointer"
            size={20}
            onClick={() => {
              if (reCode) {
                copy(reCode)
                JknAlert.success('复制成功')
              }
            }}
          />
        </div>

        <div className="bg-[#151515] flex items-center w-[420px] box-border px-1 py-2.5">
          <span>邀请链接</span>
          <span className="ml-auto w-[200px] line-clamp-1 text-tertiary">{shareUrl}</span>
          <JknIcon.Svg
            name="copy"
            className="text-tertiary cursor-pointer"
            size={20}
            onClick={() => {
              if (shareUrl) {
                copy(shareUrl)
                JknAlert.success('复制成功')
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default Invite
