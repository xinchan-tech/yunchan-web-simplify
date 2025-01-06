import type { ComponentProps } from "react"
import { JknIcon } from "."

interface IconCheckboxProps extends ComponentProps<typeof JknIcon> {
  checked?: boolean
  checkedIcon?: IconName
  uncheckedIcon?: IconName
}
export const JknIconCheckbox = ({ checked, checkedIcon, uncheckedIcon, ...props }: IconCheckboxProps) => {
  return (
    <>
      {
        checked ? (
          <JknIcon name={checkedIcon} {...props} />
        ) : (
          <JknIcon name={uncheckedIcon} {...props} />
        )
      }
    </>
  )
}