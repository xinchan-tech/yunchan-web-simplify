import { Input, type InputProps } from '@/components/ui/input'
import { useLatestRef, usePropValue } from '@/hooks'
import { cn } from '@/utils/style'
import { type ChangeEvent, ChangeEventHandler, type KeyboardEventHandler, type MouseEventHandler, useCallback, useRef } from 'react'
import { JknIcon } from '../jkn-icon'

interface JknSearchInputProps extends InputProps {
  onSearch?: (value?: string) => void
  className?: string
  rootClassName?: string
  mode?: 'lazy' | 'immediate'
}

export const JknSearchInput = ({ onSearch, className, rootClassName, value, mode = 'lazy', ...inputProps }: JknSearchInputProps) => {
  const [innerValue, setInnerValue] = usePropValue<string>(value as string)
  const searchFn = useLatestRef(onSearch)
  const timer = useRef<number>()

  const handleBlur = useCallback(() => {
    if (onSearch) {
      onSearch(innerValue)
    }
  }, [innerValue, onSearch])

  const onEnterDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    e => {
      if (e.key === 'Enter') {
        handleBlur()
      }
    },
    [handleBlur]
  )

  const onClear: MouseEventHandler<HTMLSpanElement> = useCallback(
    e => {
      e.stopPropagation()
      e.preventDefault()
      setInnerValue('')
      if (onSearch) {
        onSearch('')
      }
    },
    [onSearch, setInnerValue]
  )

  const onChange = (e: ChangeEvent<HTMLInputElement>) =>{
    setInnerValue(e.target.value)
    if (mode === 'immediate') {
      if (timer.current) {
        clearTimeout(timer.current)
      }
      timer.current = window.setTimeout(() => {
        searchFn.current?.(e.target.value)
        timer.current = undefined
      }, 300)
    }
  }

  return (
    <div className={cn('flex items-center rounded overflow-hidden box-border px-2', rootClassName)}>
      <JknIcon.Svg name="search" className="h-full" />
      <Input
        {...inputProps}
        className={cn('border-none', className)}
        value={innerValue}
        onBlur={handleBlur}
        onChange={onChange}
        onKeyDown={onEnterDown}
      />
      <span
        className="rounded cursor-pointer text-foreground/75 flex items-center justify-center"
        onClick={onClear}
        onKeyDown={() => {}}
      >
        {innerValue ? <JknIcon.Svg name="close" size={8} /> : null}
      </span>
    </div>
  )
}
