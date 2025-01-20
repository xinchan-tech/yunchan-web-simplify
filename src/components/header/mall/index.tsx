import { JknIcon } from "@/components/jkn/jkn-icon"
import { router } from "@/router"
import { useCallback } from "react"

export const HeaderMall = () => {
  const onClick = useCallback(() => {
    router.navigate('/mall')
  }, [])
  return (
    <div className="text-sm flex items-center cursor-pointer mr-4 mt-0.5 hover:icon-checked" onClick={onClick} onKeyDown={() => { }}>
      <JknIcon name="ic_top_1" className="" />&nbsp;
      <span>特色商城</span>
    </div>
  )
}