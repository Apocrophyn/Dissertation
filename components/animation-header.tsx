"use client"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { useTheme } from "next-themes"

export function AnimationHeader() {
  const { theme } = useTheme()

  return (
    <div className="flex justify-center py-6 max-h-[200px]">
      <div className="w-[200px] h-[200px]">
        <DotLottieReact src="/animations/medic-ai-animation.json" loop autoplay />
      </div>
    </div>
  )
}
