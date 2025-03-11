import { Input, type InputProps } from "@/components/ui/input"
import { usePropValue } from "@/hooks"
import { cn } from "@/utils/style"
import { type KeyboardEventHandler, useCallback } from "react"
import { JknIcon } from "../jkn-icon"

interface JknSearchInputProps extends InputProps {
  onSearch?: (value?: string) => void
  className?: string
  rootClassName?: string
}

export const JknSearchInput = ({ onSearch, className, rootClassName, value, ...inputProps }: JknSearchInputProps) => {
  const [innerValue, setInnerValue] = usePropValue<string>((value) as string)

  const handleBlur = useCallback(() => {
    if (onSearch) {
      onSearch(innerValue)
    }
  }, [innerValue, onSearch])

  const onEnterDown: KeyboardEventHandler<HTMLInputElement> = useCallback((e) => {
    if (e.key === 'Enter') {
      handleBlur()
    }

  }, [handleBlur])

  const onClear = useCallback(() => {
    setInnerValue('')
    if (onSearch) {
      onSearch('')
    }
  }, [onSearch, setInnerValue])

  return (
    <div className={cn('flex items-center rounded overflow-hidden box-border px-2', rootClassName)}>
      <JknIcon.Svg name="search" className="h-full" />
      <Input {...inputProps} className={cn('border-none', className)} value={innerValue} onBlur={handleBlur} onChange={v => setInnerValue(v.target.value)} onKeyDown={onEnterDown} />
      <span className="rounded cursor-pointer text-foreground/75 flex items-center justify-center" onClick={onClear} onKeyDown={() => { }}>
        {
          innerValue ? (
            <JknIcon.Svg name="close" size={8} />
          ) : null
        }
      </span>
    </div>
  )
}