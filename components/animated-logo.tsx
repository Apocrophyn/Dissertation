"use client"
import { motion } from "framer-motion"
import { Bot } from "lucide-react"
import { useTheme } from "next-themes"

export function AnimatedLogo() {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div className="flex items-center justify-center gap-3">
      <motion.div
        className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg"
        initial={{ scale: 0.8, rotate: -10 }}
        animate={{
          scale: [0.8, 1.1, 1],
          rotate: [-10, 10, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          repeatDelay: 5,
        }}
      >
        <motion.div
          animate={{
            y: [0, -3, 0, 3, 0],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          <Bot size={20} className="text-white" />
        </motion.div>

        {/* Animated pulse effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-blue-500"
          initial={{ opacity: 0.3, scale: 1 }}
          animate={{
            opacity: 0,
            scale: 1.5,
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
          }}
        />
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
