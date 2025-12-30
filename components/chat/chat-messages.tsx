"use client"

import { format } from "date-fns"
import { File } from "lucide-react"
import { Message } from "@/types/chat"
import { motion } from "framer-motion"
import { useAnimatedText } from "@/components/ui/animated-text"
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
            <div className="max-w-[75%] rounded-xl p-3.5 shadow-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white border border-cyan-400/30">
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-start"
        >
          <div className="glass-panel-subtle border border-white/25 rounded-xl p-3.5 shadow-lg">
            <div className="flex gap-1">
              <motion.div
                className="w-2 h-2 bg-cyan-400 rounded-full"
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: 0,
                }}
              />
              <motion.div
                className="w-2 h-2 bg-cyan-400 rounded-full"
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: 0.2,
                }}
              />
              <motion.div
                className="w-2 h-2 bg-cyan-400 rounded-full"
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: 0.4,
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
} 