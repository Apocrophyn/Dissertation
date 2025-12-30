"use client"

import { format } from "date-fns"
import { File } from "lucide-react"
import { Message } from "@/types/chat"
import { motion } from "framer-motion"
import { useAnimatedText } from "@/components/ui/animated-text"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { useState, useEffect } from "react"

interface ChatMessagesProps {
  messages: Message[]
  isTyping: boolean
}

interface AnimatedMessageProps {
  message: Message
  formatMessage: (content: string) => string
  formatTime: (date: Date) => string
}

// Component for animated assistant messages
function AnimatedAssistantMessage({ message, formatMessage, formatTime }: AnimatedMessageProps) {
  const [isAnimating, setIsAnimating] = useState(true)
  const animatedText = useAnimatedText(isAnimating ? message.content : "", " ")

  useEffect(() => {
    // Check if this is a new message (less than 1 second old)
    const messageAge = Date.now() - new Date(message.timestamp).getTime()
    if (messageAge > 1000) {
      setIsAnimating(false)
    } else {
      // Stop animation after text is fully displayed
      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, 5000) // Animation duration

      return () => clearTimeout(timer)
    }
  }, [message.timestamp])

  const displayText = isAnimating && animatedText ? animatedText : message.content

  return (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="max-w-[75%] rounded-xl p-3.5 shadow-lg glass-panel border border-white/30">
        {message.hasFile && (
          <div className="flex items-center gap-2 mb-2 text-sm">
            <File className="w-4 h-4" />
            <span className="truncate">{message.fileName}</span>
          </div>
        )}
        <div
          className="break-words whitespace-pre-wrap text-sm leading-relaxed text-light"
          dangerouslySetInnerHTML={{ __html: formatMessage(displayText) }}
        />
        <div className="text-[10px] mt-2 text-muted-custom">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </motion.div>
  )
}

export function ChatMessages({ messages, isTyping }: ChatMessagesProps) {
  const formatTime = (date: Date) => {
    return format(date, "HH:mm")
  }

  const formatMessage = (content: string) => {
    // Replace **text** with bold text
    return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  }

  return (
    <div className="flex flex-col space-y-3 p-4 min-h-[calc(100vh-16rem)]">
      {messages.map((message) => {
        // Use animated component for assistant messages
        if (message.sender === "assistant") {
          return (
            <AnimatedAssistantMessage
              key={message.id}
              message={message}
              formatMessage={formatMessage}
              formatTime={formatTime}
            />
          )
        }

        // Regular rendering for user messages
        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end"
          >
            <div className="max-w-[75%] rounded-xl p-3.5 shadow-lg bg-white/10 text-white border border-white/20">
              {message.hasFile && (
                <div className="flex items-center gap-2 mb-2 text-sm">
                  <File className="w-4 h-4" />
                  <span className="truncate">{message.fileName}</span>
                </div>
              )}
              <div
                className="break-words whitespace-pre-wrap text-sm leading-relaxed text-white"
                dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
              />
              <div className="text-[10px] mt-2 text-white/60">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </motion.div>
        )
      })}
      {isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start"
        >
          <div className="glass-panel border border-white/30 rounded-xl p-3.5 shadow-lg">
            <div className="flex items-center gap-3">
              {/* MedicAI Logo */}
              <div className="flex-shrink-0">
                <svg
                  viewBox="0 0 32 32"
                  fill="none"
                  className="w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="16" cy="16" r="14" stroke="url(#grad1)" strokeWidth="1.5" fill="none" />
                  <circle cx="16" cy="16" r="10" stroke="url(#grad2)" strokeWidth="1.5" fill="none" />
                  <circle cx="16" cy="16" r="6" stroke="url(#grad3)" strokeWidth="1.5" fill="none" />
                  <path d="M16 10 L16 22 M10 16 L22 16" stroke="url(#grad4)" strokeWidth="1.5" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#e5e5e5" stopOpacity="0.9" />
                    </linearGradient>
                    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#d4d4d4" stopOpacity="0.8" />
                    </linearGradient>
                    <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#c4c4c4" stopOpacity="0.7" />
                    </linearGradient>
                    <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#d4d4d4" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              {/* Text Shimmer */}
              <TextShimmer
                className="text-sm font-medium [--base-color:theme(colors.gray.400)] [--base-gradient-color:theme(colors.white)] dark:[--base-color:theme(colors.gray.500)] dark:[--base-gradient-color:theme(colors.white)]"
                duration={1.5}
              >
                MedicAI is thinking...
              </TextShimmer>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
} 