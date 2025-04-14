import { useConfig } from '@/store'
import { useEffect } from 'react'
import FooterTime from './footer-time'
import { StockBar } from './stock-bar'
// import { ServerBar } from "./server-bar"

export const Footer = () => {
  const config = useConfig()

  useEffect(() => {
    document.documentElement.classList.toggle(
      'stock-color-reverse',
      config.setting.upOrDownColor === 'upRedAndDownGreen'
    )
  }, [config.setting.upOrDownColor])
  return (
    <div className="flex items-center h-full w-full bg-background px-2 rounded-t-xs">
      <StockBar />
      <div className="ml-auto pr-2">
        <FooterTime />
      </div>
      <div className="pr-2">{/* <ServerBar /> */}</div>
    </div>
  )
}
