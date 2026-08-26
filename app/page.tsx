"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { AnimatePresence, motion } from "framer-motion"

import { useToast } from "@/components/ui/use-toast"
import { AmbientField } from "@/components/ambient-field"
import { AppSidebar } from "@/components/chat/app-sidebar"
import { SessionHeader } from "@/components/chat/session-header"
import { Composer } from "@/components/chat/composer"
import { EmptyState } from "@/components/chat/empty-state"
import { getMode } from "@/components/chat/mode-config"
import { prepareAttachment, sendChatMessage } from "@/lib/chat-api"
import { loadChatHistory, saveChatHistory } from "@/lib/local-chat-history"
import type { ChatType, ChatSession, Message } from "@/types/chat"
import { cn } from "@/lib/utils"

const ChatMessages = dynamic(
  () => import("@/components/chat/chat-messages").then((module) => module.ChatMessages),
  { ssr: false }
)

function createSession(type: ChatType): ChatSession {
  const mode = getMode(type)
  const now = new Date()
  return {
    id: crypto.randomUUID(),
    type,
    title: mode.sessionTitle,
    lastMessage: mode.greeting,
    timestamp: now,
    messages: [],
  }
}

export default function MedicAI() {
  const initialSession = useMemo(() => createSession("symptom-checker"), [])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([initialSession])
  const [activeSessionId, setActiveSessionId] = useState(initialSession.id)
  const [historyReady, setHistoryReady] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const storageWarningShown = useRef(false)
  const { toast } = useToast()

  const activeSession =
    chatSessions.find((session) => session.id === activeSessionId) ?? chatSessions[0]
  const mode = getMode(activeSession.type)
  const messages = activeSession.messages

  useEffect(() => {
    const stored = loadChatHistory()
    if (stored.sessions.length > 0) {
      setChatSessions(stored.sessions)
      const activeExists = stored.sessions.some((session) => session.id === stored.activeSessionId)
      setActiveSessionId(activeExists && stored.activeSessionId ? stored.activeSessionId : stored.sessions[0].id)
    }
    setHistoryReady(true)
  }, [])

  useEffect(() => {
    if (!historyReady) return
    const saved = saveChatHistory(chatSessions, activeSessionId)
    if (!saved && !storageWarningShown.current) {
      storageWarningShown.current = true
      toast({
        title: "History could not be saved",
        description: "Your browser storage may be full or disabled.",
        variant: "destructive",
      })
    }
  }, [activeSessionId, chatSessions, historyReady, toast])

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return
    element.scrollTo({
      top: element.scrollHeight,
      behavior: messages.length > 1 ? "smooth" : "auto",
    })
  }, [messages, isTyping])

  const patchSession = useCallback((id: string, nextMessages: Message[], title?: string) => {
    const now = new Date()
    setChatSessions((previous) =>
      previous.map((session) =>
        session.id === id
          ? {
              ...session,
              title: title ?? session.title,
              messages: nextMessages,
              lastMessage: nextMessages[nextMessages.length - 1]?.content ?? session.lastMessage,
              timestamp: now,
            }
          : session
      )
    )
  }, [])

  const handleSelectSession = useCallback((session: ChatSession) => {
    setActiveSessionId(session.id)
    setInputValue("")
    setSelectedFile(null)
    setSidebarOpen(false)
  }, [])

  const handleNewSession = useCallback((type: ChatType) => {
    const session = createSession(type)
    setChatSessions((previous) => [session, ...previous])
    setActiveSessionId(session.id)
    setInputValue("")
    setSelectedFile(null)
    setSidebarOpen(false)
  }, [])

  const handleRenameSession = useCallback((id: string, nextTitle: string) => {
    const title = nextTitle.trim().slice(0, 80)
    if (!title) return
    setChatSessions((previous) =>
      previous.map((session) => (session.id === id ? { ...session, title } : session))
    )
  }, [])

  const handleDeleteSession = useCallback(
    (id: string) => {
      const remaining = chatSessions.filter((session) => session.id !== id)
      if (remaining.length === 0) {
        const replacement = createSession("symptom-checker")
        setChatSessions([replacement])
        setActiveSessionId(replacement.id)
        return
      }

      setChatSessions(remaining)
      if (activeSessionId === id) setActiveSessionId(remaining[0].id)
    },
    [activeSessionId, chatSessions]
  )

  const handleDeleteAll = useCallback(() => {
    const replacement = createSession("symptom-checker")
    setChatSessions([replacement])
    setActiveSessionId(replacement.id)
    setInputValue("")
    setSelectedFile(null)
  }, [])

  const handleSend = useCallback(
    async (override?: string) => {
      const text = (override ?? inputValue).trim()
      if ((!text && !selectedFile) || isTyping) return

      let attachment
      if (selectedFile) {
        try {
          attachment = await prepareAttachment(selectedFile)
        } catch (error) {
          toast({
            title: "Attachment not accepted",
            description: error instanceof Error ? error.message : "Try a smaller PDF or image.",
            variant: "destructive",
          })
          return
        }
      }

      const session = activeSession
      const userMessage: Message = {
        id: crypto.randomUUID(),
        content: text || `Attached ${selectedFile?.name}`,
        sender: "user",
        timestamp: new Date(),
        hasFile: !!selectedFile,
        fileName: selectedFile?.name,
      }
      const withUser = [...session.messages, userMessage]
      const automaticTitle =
        session.messages.length === 0 && text
          ? text.length > 42
            ? `${text.slice(0, 42).trimEnd()}…`
            : text
          : undefined

      patchSession(session.id, withUser, automaticTitle)
      setInputValue("")
      setSelectedFile(null)
      setIsTyping(true)

      try {
        const response = await sendChatMessage({
          type: session.type,
          message: text,
          history: session.messages.map(({ sender, content }) => ({ sender, content })),
          attachment,
        })
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          content: response.message,
          sender: "assistant",
          timestamp: new Date(),
        }
        patchSession(session.id, [...withUser, assistantMessage], automaticTitle)
      } catch (error) {
        toast({
          title: "No response",
          description:
            error instanceof Error
              ? error.message
              : "MedicAI could not be reached. Your message is saved — please try again.",
          variant: "destructive",
        })
      } finally {
        setIsTyping(false)
      }
    },
    [activeSession, inputValue, selectedFile, isTyping, patchSession, toast]
  )

  if (!historyReady) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-000">
        <span className="sr-only">Loading MedicAI</span>
      </div>
    )
  }

  const sidebar = (
    <AppSidebar
      sessions={chatSessions}
      activeSession={activeSession}
      setActiveSession={handleSelectSession}
      onNewSession={handleNewSession}
      onRenameSession={handleRenameSession}
      onDeleteSession={handleDeleteSession}
      onDeleteAll={handleDeleteAll}
    />
  )

  return (
    <div className="relative flex h-[100dvh] overflow-hidden bg-ink-000">
      <AmbientField />

      <div className="hidden lg:flex">{sidebar}</div>

      <AnimatePresence>
        {sidebarOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              {sidebar}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <main className="flex min-w-0 flex-1 flex-col">
        <SessionHeader
          mode={mode}
          title={activeSession.title}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />

        <div ref={scrollRef} className={cn("min-h-0 flex-1 overflow-y-auto")}>
          {messages.length === 0 ? (
            <EmptyState key={activeSession.id} mode={mode} onPick={(text) => handleSend(text)} />
          ) : (
            <ChatMessages messages={messages} isTyping={isTyping} />
          )}
        </div>

        <div className="mx-auto w-full max-w-3xl">
          <Composer
            mode={mode}
            value={inputValue}
            onChange={setInputValue}
            onSend={() => handleSend()}
            isBusy={isTyping}
            file={selectedFile}
            onFileSelect={(file) => {
              setSelectedFile(file)
              toast({ title: "Report attached", description: file.name })
            }}
            onFileClear={() => setSelectedFile(null)}
          />
        </div>
      </main>
    </div>
  )
}
