import { format } from "date-fns"
import { File } from "lucide-react"
import { Message } from "@/types/chat"
import { motion } from "framer-motion"

interface ChatMessagesProps {
  messages: Message[]
  isTyping: boolean
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
    <div className="flex flex-col space-y-4 p-4 min-h-[calc(100vh-16rem)]">
      {messages.map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex ${
            message.sender === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-4 shadow-sm ${
              message.sender === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            {message.hasFile && (
              <div className="flex items-center gap-2 mb-2 text-sm">
                <File className="w-4 h-4" />
                <span className="truncate">{message.fileName}</span>
              </div>
            )}
            <div 
              className="break-words whitespace-pre-wrap text-base"
              dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
            />
            <div
              className={`text-xs mt-2 ${
                message.sender === "user"
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground"
              }`}
            >
              {formatTime(message.timestamp)}
            </div>
          </div>
        </motion.div>
      ))}
      {isTyping && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-start"
        >
          <div className="bg-muted rounded-lg p-4 shadow-sm">
            <div className="flex gap-1">
              <motion.div
                className="w-2 h-2 bg-foreground/50 rounded-full"
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: 0,
                }}
              />
              <motion.div
                className="w-2 h-2 bg-foreground/50 rounded-full"
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: 0.2,
                }}
              />
              <motion.div
                className="w-2 h-2 bg-foreground/50 rounded-full"
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