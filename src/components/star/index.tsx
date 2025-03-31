import { type FC, useState } from 'react'
import { JknIcon } from '../jkn/jkn-icon'
import StarRect from './rect'

interface StarProps {
  className?: string
  checked?: boolean
  onChange?: (checked: boolean) => void
  size?: number
}

const Star = (props: StarProps) => {
  const [hover, setHover] = useState(false)

  const icon: IconName = props.checked ? 'ic_star_on' : hover ? 'ic_star_hover' : 'ic_star_off'
  
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    props.onChange?.(!props.checked)
  }
  return (
    <span onClick={onClick} onKeyDown={() => { }} onFocus={() => { }} onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <JknIcon name={icon} className="w-5 h-5 flex items-center" style={{ width: props.size, height: props.size }} />
    </span>
  )
}


Star.Rect = StarRect

export default Star as FC<StarProps> & { Rect: typeof StarRect }
