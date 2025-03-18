"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/utils/style"

/**
 * Switch组件
 * 
 * 基于Radix UI的Switch组件封装，提供了开关切换功能
 * 
 * @param props 组件属性
 * @param props.className 自定义类名
 * @param props.activeColor 激活状态的颜色，默认为主题色
 * @param props.inactiveColor 未激活状态的颜色，默认为灰色
 * @param props.thumbColor 小球的颜色，默认为#2E2E2E
 * @returns Switch组件
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
    activeColor?: string;
    inactiveColor?: string;
    thumbColor?: string;
  }
>(({ className, activeColor, inactiveColor, thumbColor, style, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[var(--switch-active-bg)] data-[state=unchecked]:bg-[var(--switch-inactive-bg)]",
      className
    )}
    style={{
      "--switch-active-bg": activeColor || "#DBDBDB",
      "--switch-inactive-bg": inactiveColor || "#DBDBDB",
      ...style
    } as React.CSSProperties}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-[var(--switch-thumb-color)] shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-[14px] data-[state=unchecked]:translate-x-[-6px]"
      )}
      style={{
        "--switch-thumb-color": thumbColor || "#2E2E2E"
      } as React.CSSProperties}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
