"use client"
import { motion } from "framer-motion"
import Image from "next/image"
import { useTheme } from "next-themes"

export function MedicalLogo() {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div className="flex items-center justify-center gap-3">
      <motion.div
        className="relative flex items-center justify-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative w-10 h-10 flex items-center justify-center">
          <Image
            src="/images/medical-logo.png"
            alt="Medic AI Logo"
            width={32}
            height={32}
            className={isDark ? "brightness-0 invert" : "brightness-0"}
          />
        </div>
      </motion.div>

      <motion.h1
        className="text-xl font-bold text-gray-800 dark:text-white"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Medic AI
      </motion.h1>
    </div>
  )
}
