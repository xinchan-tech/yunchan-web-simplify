import { produce } from "immer"
import { useState, useCallback } from "react"

export const useCheckbox = (initialValue: boolean) => {
  const [checked, setChecked] = useState(initialValue)

  const onChange = useCallback((v: boolean) => {
    setChecked(v)
  }, [])

  const toggle = useCallback(() => {  
    setChecked(v => !v)
  }, [])

  return {
    checked,
    onChange,
    toggle
  }
}

export const useCheckboxGroup = (initialValue: string[]) => {
  const [checked, setChecked] = useState(initialValue)

  const onChange = useCallback((key: string, checked: boolean) => {
    setChecked(produce(s => {
      if (checked) {
        if(!s.includes(key)) {
          s.push(key)
        }
      } else {
        const index = s.indexOf(key)
        if (index !== -1) {
          s.splice(index, 1)
        }
      }
    }))
  }, [])

  const toggle = useCallback((key: string) => {
    setChecked(produce(s => {
      const index = s.indexOf(key)
      if (index !== -1) {
        s.splice(index, 1)
      } else {
        s.push(key)
      }
    }))
  }, [])

  const getIsChecked = useCallback((key: string) => {
    return checked.includes(key)
  }, [checked])

  const setCheckedAll = useCallback((keys: string[]) => {
    console.log(keys)
    setChecked(keys)
  }, [])
  

  return {
    checked,
    onChange,
    toggle,
    getIsChecked,
    setCheckedAll
  }
}