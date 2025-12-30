"use client"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { MessageCircle, ClipboardList, Scan, Heart, ChevronRight, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export type ChatSession = {
  id: string
  type: "chat" | "report" | "xray" | "mental"
  title: string
  lastMessage: string
  timestamp: Date
  messages: any[] // Using any for simplicity, but should match your Message type
}

interface ChatHistoryProps {
  sessions: ChatSession[]
  onSelectSession: (session: ChatSession) => void
  className?: string
}

export function ChatHistory({ sessions, onSelectSession, className }: ChatHistoryProps) {
  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="flex flex-col gap-2 p-2">
        <div className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-gray-500 dark:text-gray-400">
          <Clock size={14} />
          <span>Recent Conversations</span>
        </div>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>No recent conversations</p>
            <p className="mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          sessions.map((session) => (
            <motion.button
              key={session.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => onSelectSession(session)}
              className="flex flex-col w-full rounded-lg p-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {session.type === "chat" && <MessageCircle size={16} className="text-blue-500" />}
                  {session.type === "report" && <ClipboardList size={16} className="text-green-500" />}
                  {session.type === "xray" && <Scan size={16} className="text-purple-500" />}
                  {session.type === "mental" && <Heart size={16} className="text-red-500" />}
                  <span className="font-medium">{session.title}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {format(session.timestamp, "MMM d, h:mm a")}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{session.lastMessage}</p>
              <div className="flex justify-end mt-2">
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </motion.button>
          ))
        )}
      </div>
    </ScrollArea>
  )
}

export function NewChatSelector({ onSelect }: { onSelect: (type: "chat" | "report" | "xray" | "mental") => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-lg font-medium text-center">Start a new conversation</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-2">
        Select the type of conversation you want to start
      </p>

      <Button variant="outline" className="justify-start gap-2 py-6" onClick={() => onSelect("chat")}>
        <MessageCircle size={18} className="text-blue-500" />
        <div className="flex flex-col items-start">
          <span className="font-medium">General Chat</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Ask general medical questions</span>
        </div>
      </Button>

      <Button variant="outline" className="justify-start gap-2 py-6" onClick={() => onSelect("report")}>
        <ClipboardList size={18} className="text-green-500" />
        <div className="flex flex-col items-start">
          <span className="font-medium">Upload Report</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Analyze medical reports</span>
        </div>
      </Button>

      <Button variant="outline" className="justify-start gap-2 py-6" onClick={() => onSelect("xray")}>
        <Scan size={18} className="text-purple-500" />
        <div className="flex flex-col items-start">
          <span className="font-medium">Upload X-Ray</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Analyze X-ray images</span>
        </div>
      </Button>

      <Button variant="outline" className="justify-start gap-2 py-6" onClick={() => onSelect("mental")}>
        <Heart size={18} className="text-red-500" />
        <div className="flex flex-col items-start">
          <span className="font-medium">Mental Health</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Discuss mental health concerns</span>
        </div>
      </Button>
    </motion.div>
  )
}
