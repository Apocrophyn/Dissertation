"use client"
import { useTheme } from "next-themes"

export function MedicalLogo() {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 flex items-center justify-center rounded ${isDark ? 'bg-white' : 'bg-gray-900'}`}>
        <span className={`text-lg font-bold ${isDark ? 'text-gray-900' : 'text-white'}`}>M</span>
      </div>
      <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Medic AI
      </span>
    </div>
  )
} 