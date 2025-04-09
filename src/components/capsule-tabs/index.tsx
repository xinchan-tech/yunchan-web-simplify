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
    <div className={cn('flex items-center flex-wrap capsule-tabs space-x-5', className)}>
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
  const isActive = value === context.value

  return (
    <div
      className={cn(
        'flex h-[30px] p-[4px] items-center justify-center rounded-sm cursor-pointer transition-all duration-200 text-tertiary capsule-tab-item relative after:hidden',
        className
      )}
      data-checked={value === context.value}
      data-type={context.type}
      style={{
        background: isActive ? 'hsl(var(--accent))' : 'transparent',
        color: isActive ? context.activeColor || 'hsl(var(--foreground))' : '',
        // 激活状态下的模拟文字加粗效果
        textShadow: isActive ? '0 0 0.65px currentColor, 0 0 0.65px currentColor' : 'none'
      }}
      onClick={() => {
        !disabled && context.onChange?.(value)
      }}
      onKeyDown={() => {}}
    >
      <div className="relative">{label}</div>
    </div>
  )
}

_CapsuleTabs.Tab = TabItem
export const CapsuleTabs = _CapsuleTabs as typeof _CapsuleTabs & {
  Tab: typeof TabItem
}

export * from './collect'
