import { cn } from "@/utils/style"
import { nanoid } from "nanoid"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  /**
   * 随机100 - 10的长度变化
   */
  const randomWidth1 = Math.floor(Math.random() * 90 + 10)
  const randomWidth2 = Math.floor(Math.random() * 90 + 10)

  const randomMax = Math.max(randomWidth1, randomWidth2)
  const randomMin = Math.min(randomWidth1, randomWidth2)
  

  
  const skeletonId = `skeleton-${nanoid(8)}`
  return (
    <>
      <div
        className={cn("animate-pulse rounded-md bg-primary/10 bg-[#2c2d30]", className)}
        id={skeletonId}
        style={{

        }}
        {...props}
      />
      <style jsx>
        {`
          #${skeletonId} {
            animation: skeleton-${skeletonId}-width 3s infinite;
          }
          @keyframes skeleton-${skeletonId}-width {
            0%, 100% {
              width: ${randomMin}%;
              opacity: 1;
            }
            50% {
              width: ${randomMax}%;
              opacity: 0.5;
            }
          }
        `}
      </style>
    </>
  )
}

export { Skeleton }
