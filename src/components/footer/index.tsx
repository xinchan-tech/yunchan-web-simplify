import { useConfig } from "@/store"
import FooterTime from "./footer-time"
import { StockBar } from "./stock-bar"
import { useEffect } from "react"

export const Footer = () => {
  const config = useConfig()

  useEffect(() => {
    document.documentElement.classList.toggle('stock-color-reverse', config.setting.upOrDownColor === 'upRedAndDownGreen')
  }, [config.setting.upOrDownColor])
  return (
    <div className="flex items-center h-full w-full">
      <StockBar />
      <div className="ml-auto pr-2">
        <FooterTime />
      </div>
    </div>

  )
}