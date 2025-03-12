import { cn } from '@/utils/style'
import { type PropsWithChildren, type ReactNode, createContext, useContext } from 'react'

interface CapsuleTabsProps {
  activeKey?: string
  onChange?: (value: string) => void
  type?: 'default' | 'text'
  className?: string
  activeColor?: string
}

interface CapsuleTabsContext {
  value?: string
  onChange?: (value: string) => void
  type: CapsuleTabsProps['type']
  activeColor?: string
}

const CapsuleTabsContext = createContext<CapsuleTabsContext>({} as CapsuleTabsContext)

const _CapsuleTabs = ({
  activeKey,
  onChange,
  children,
  type = 'default',
  className,
  activeColor
}: PropsWithChildren<CapsuleTabsProps>) => {
  return (
    <div className={cn('flex items-center flex-wrap capsule-tabs space-x-4', className)}>
      <CapsuleTabsContext.Provider value={{ value: activeKey, onChange, type, activeColor }}>
        {children}
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
        'items-center justify-center rounded-xl cursor-pointer py-3.5 transition-all duration-200 text-tertiary capsule-tab-item relative after:hidden',
        className
      )}
      data-checked={value === context.value}
      data-type={context.type}
      style={{
        background: value === context.value && context.type === 'default' ? 'hsl(var(--active-color))' : 'transparent',
        color: value === context.value && context.type === 'text' ? (context.activeColor || 'hsl(var(--foreground))') : '',
      }}
      onClick={() => {
        !disabled && context.onChange?.(value)
      }}
      onKeyDown={() => { }}
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
