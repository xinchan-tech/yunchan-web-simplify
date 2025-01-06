import { useState } from "react"
import { JknIcon } from "../jkn/jkn-icon"

interface StarProps {
  className?: string
  checked?: boolean
  onChange?: (checked: boolean) => void
}

const Star = (props: StarProps) => {
  const [hover, setHover] = useState(false)

  const icon: IconName = props.checked ? 'ic_star_on' : hover ? 'ic_star_hover' : 'ic_star_off'

  return (
    <span onFocus={() => { }} onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <JknIcon name={icon} className="w-5 h-5" />
    </span>
  )
}

export default Star

