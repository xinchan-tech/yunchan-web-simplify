import { useCallback, useRef } from 'react'
import { Outlet } from 'react-router'
import { Resizable } from 're-resizable'
import { useLocalStorageState } from "ahooks"

const StockPage = () => {
  const [width, setWidth] = useLocalStorageState('stock-page-width', {
    defaultValue: '360px'
  })

  const widthInit = useRef(width)

  const onResizeEnd = useCallback((d: { width: number }) => {
    setWidth(w => `${Math.max(0, Math.min(d.width + Number.parseFloat(w ?? '0'), 1024))}px`)
  }, [setWidth])

  return (
    <div className="h-full flex flex-nowrap overflow-hidden">
      <div className="flex-1 order-1 h-full rounded-xs overflow-hidden">
        <div />
      </div>
      <Resizable
        onResizeStop={(_, __, ___, d) => onResizeEnd(d)}
        minWidth={1}
        maxWidth={1024}
        defaultSize={{
          width: widthInit.current,
        }}
        className="order-2 data-[width=hide]:hidden h-full flex-shrink-0"
      >
        <Outlet />
      </Resizable>
    </div>
  )
}

export default StockPage
