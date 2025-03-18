/**
 * 自定义勾选图标组件
 * @param props 组件属性
 * @param props.color 图标颜色，默认为 #C0B8AA
 * @param props.className 自定义类名
 */
export const CheckIcon = ({ color = "#C0B8AA", className = "" }: { color?: string, className?: string }) => {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M15.2526 6.47432L8.99481 12.7322L4.99998 8.73732" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

/**
 * 自定义关闭图标组件
 * @param props 组件属性
 * @param props.color 图标颜色，默认为 #C0B8AA
 * @param props.className 自定义类名
 */
export const CloseIcon = ({ color = "#C0B8AA", className = "" }: { color?: string, className?: string }) => {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M6 14.4854L14.4853 6.00007" stroke={color} strokeLinecap="round"/>
      <path d="M6 6L14.4853 14.4853" stroke={color} strokeLinecap="round"/>
    </svg>
  );
};

/**
 * 自定义勾选图标组件 - 带有渐变色效果
 */
export const GradientCheckIcon = () => {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.2526 6.47432L8.99481 12.7322L4.99998 8.73732" stroke="url(#paint0_linear_3501_12871)" stroke-linecap="round" stroke-linejoin="round"/>
      <defs>
      <linearGradient id="paint0_linear_3501_12871" x1="5.70367" y1="8.81523" x2="10.1408" y2="12.6852" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FADFB0"/>
      <stop offset="0.46" stop-color="#FECA90"/>
      <stop offset="1" stop-color="#EC9B51"/>
      </linearGradient>
      </defs>
    </svg>
  );
};