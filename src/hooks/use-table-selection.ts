import { useImmer } from "use-immer"


interface TableSelectionProps {
  hasAll: (data: string[]) => boolean
  selectAll: () => string[]
}
export const useTableSelection = (opts: TableSelectionProps) => {
  const [check, setCheck] = useImmer<{ all: boolean, selected: string[] }>({
    all: false,
    selected: []
  })

  const onCheckboxClick = (code: string) => {
    console.log(123)
    if (check.selected.includes(code)) {
      setCheck(d => {
        d.selected = d.selected.filter(s => s !== code)
        d.all = opts.hasAll(d.selected)
      })
    } else {
      setCheck(d => {
        d.selected.push(code)
      })
    }
  }

  const onCheckAllChange = (e: boolean) => {
    setCheck(d => {
      d.all = e
      d.selected = e ? opts.selectAll() ?? [] : []
    })
  }

  return {
    check,
    onCheck: onCheckboxClick,
    onCheckAll: onCheckAllChange
  }
}