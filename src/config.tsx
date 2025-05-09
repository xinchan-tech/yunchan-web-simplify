import type { PropsWithChildren } from "react"

export const SysConfigProvider = ({ children }: PropsWithChildren) => {
  // useMount(() => {
  //   TCBroadcast.on(BroadcastChannelMessageType.UserLogin, () => {
  //     window.location.reload()
  //   })
  // })
  return (
    <>
      {children}
    </>
  )
}