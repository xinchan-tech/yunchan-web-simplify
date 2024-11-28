import { cn } from "@/utils/style"
import { createContext, type PropsWithChildren, type ReactNode, useContext } from "react"

interface CapsuleTabsProps {
  activeKey?: string
  onChange?: (value: string) => void
  type?: 'default' | 'text'
}

interface CapsuleTabsContext {
  value?: string
  onChange?: (value: string) => void
  type: CapsuleTabsProps['type']
}

const CapsuleTabsContext = createContext<CapsuleTabsContext>({} as CapsuleTabsContext)

const _CapsuleTabs = ({ activeKey, onChange, children, type = 'default' }: PropsWithChildren<CapsuleTabsProps>) => {
  return (
    <div className="flex items-center space-x-2 flex-wrap">
      <CapsuleTabsContext.Provider value={{ value: activeKey, onChange, type }}>
        {
          children
        }
      </CapsuleTabsContext.Provider>
    </div>
  )
}

interface TabItemProps {
  value: string
  label: string | ReactNode
  disabled?: boolean
  className?: string
}

const TabItem = ({ value, label, disabled, className }: TabItemProps) => {
  const context = useContext(CapsuleTabsContext)

  return (
    <div
      className={cn(
        'items-center justify-center rounded-xl cursor-pointer text-xs px-3 py-0.5 transition-all duration-200',
        className
      )}
      style={{
        background: value === context.value && context.type === 'default'  ? 'hsl(var(--active-color))' : 'transparent',
        color: value === context.value && context.type === 'text' ? 'hsl(var(--active-color))' : 'hsl(var(--text))',
      }}
      onClick={() => { !disabled && context.onChange?.(value) }} onKeyDown={() => { }}
    >
      {label}
    </div>
  )
}

_CapsuleTabs.Tab = TabItem
export const CapsuleTabs = _CapsuleTabs as typeof _CapsuleTabs & {
  Tab: typeof TabItem
}

export * from './collect'
