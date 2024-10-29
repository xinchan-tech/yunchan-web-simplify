import { theme } from "antd"
import { createContext, type PropsWithChildren, useContext } from "react"

interface CapsuleTabsProps {
  activeKey?: string
  onChange?: (value: string) => void
}

interface CapsuleTabsContext {
  value?: string
  onChange?: (value: string) => void
}

const CapsuleTabsContext = createContext<CapsuleTabsContext>({} as CapsuleTabsContext)

const _CapsuleTabs = ({ activeKey, onChange, children }: PropsWithChildren<CapsuleTabsProps>) => {
  return (
    <div className="flex items-center space-x-2">
      <CapsuleTabsContext.Provider value={{ value: activeKey, onChange }}>
        {
          children
        }
      </CapsuleTabsContext.Provider>
    </div>
  )
}

interface TabItemProps {
  value: string
  label: string
}

const TabItem = ({ value, label }: TabItemProps) => {
  const context = useContext(CapsuleTabsContext)
  const { token: themeToken } = theme.useToken()
  return (
    <div
      className="items-center justify-center rounded-xl cursor-pointer text-xs px-3 py-0.5"
      style={{
        background: value === context.value ? themeToken.colorPrimary : 'transparent',
      }}
      onClick={() => { context.onChange?.(value) }} onKeyDown={() => { }}
    >
      {label}
    </div>
  )
}

_CapsuleTabs.Tab = TabItem
const CapsuleTabs = _CapsuleTabs as typeof _CapsuleTabs & {
  Tab: typeof TabItem
}

export default CapsuleTabs