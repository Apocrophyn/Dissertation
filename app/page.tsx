"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { AnimatePresence, motion } from "framer-motion"

import { useToast } from "@/components/ui/use-toast"
import { useMobileContext } from "@/components/providers/mobile-provider"
import { AmbientField } from "@/components/ambient-field"
import { AppSidebar } from "@/components/chat/app-sidebar"
import { SessionHeader } from "@/components/chat/session-header"
import { Composer } from "@/components/chat/composer"
import { EmptyState } from "@/components/chat/empty-state"
import { getMode } from "@/components/chat/mode-config"
import { sendChatMessage, uploadFile } from "@/lib/chat-api"
import type { ChatType, ChatSession, Message } from "@/types/chat"
import { cn } from "@/lib/utils"

const ChatMessages = dynamic(
  () => import("@/components/chat/chat-messages").then((m) => m.ChatMessages),
  { ssr: false }
)

const SESSIONS_PER_PAGE = 5

function createSession(type: ChatType): ChatSession {
  const mode = getMode(type)
  const now = new Date()
  return {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    title: mode.sessionTitle,
    lastMessage: mode.greeting,
    timestamp: now,
    // The greeting lives in the empty state, so a new session starts with no
    // messages — that is what makes the empty state reachable at all.
    messages: [],
  }
}

export default function MedicAI() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => [
    createSession("symptom-checker"),
  ])
  const [activeSession, setActiveSession] = useState<ChatSession>(() => chatSessions[0])
  const [displayCount, setDisplayCount] = useState(SESSIONS_PER_PAGE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const [inputValue, setInputValue] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobileContext()
  const { toast } = useToast()

  const mode = getMode(activeSession.type)
  const messages = activeSession.messages

  useEffect(() => setMounted(true), [])

  const sorted = [...chatSessions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  const visibleSessions = sorted.slice(0, displayCount)
  const hasMore = displayCount < chatSessions.length

  /**
   * Keeps the transcript pinned to the newest message.
   * Sets scrollTop directly rather than calling scrollIntoView — the latter
   * scrolls every ancestor, which hijacks the page inside embedded previews.
   */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: messages.length > 1 ? "smooth" : "auto" })
  }, [messages, isTyping])

  /** Writes messages onto a session and keeps the list in sync. */
  const patchSession = useCallback((id: string, next: Message[]) => {
    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, messages: next, lastMessage: next[next.length - 1]?.content ?? s.lastMessage }
          : s
      )
    )
    setActiveSession((prev) =>
      prev.id === id
        ? { ...prev, messages: next, lastMessage: next[next.length - 1]?.content ?? prev.lastMessage }
        : prev
    )
  }, [])

  const handleNewSession = useCallback((type: ChatType) => {
    const session = createSession(type)
    setChatSessions((prev) => [session, ...prev])
    setActiveSession(session)
    setInputValue("")
    setSelectedFile(null)
    setSidebarOpen(false)
  }, [])

  const handleSend = useCallback(
    async (override?: string) => {
      const text = (override ?? inputValue).trim()
      if ((!text && !selectedFile) || isTyping) return

      const sessionId = activeSession.id
      const userMessage: Message = {
        id: `${Date.now()}-user`,
        content: text,
        sender: "user",
        timestamp: new Date(),
        hasFile: !!selectedFile,
        fileName: selectedFile?.name,
      }

      const withUser = [...activeSession.messages, userMessage]
      patchSession(sessionId, withUser)
      setInputValue("")

      // First real message names the session — "Symptom consultation" tells the
      // user nothing once they have five of them.
      if (activeSession.messages.length === 0 && text) {
        const title = text.length > 42 ? `${text.slice(0, 42).trimEnd()}…` : text
        setChatSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, title } : s)))
        setActiveSession((prev) => (prev.id === sessionId ? { ...prev, title } : prev))
      }

      let fileUrl: string | undefined
      if (selectedFile) {
        try {
          fileUrl = await uploadFile(selectedFile)
        } catch {
          toast({
            title: "Upload failed",
            description: "That file could not be uploaded. Check the format and try again.",
            variant: "destructive",
          })
          return
        }
        setSelectedFile(null)
      }

      setIsTyping(true)
      try {
        const response = await sendChatMessage({ type: activeSession.type, message: text, fileUrl })
        const assistantMessage: Message = {
          id: `${Date.now()}-assistant`,
          content: response.message,
          sender: "assistant",
          timestamp: new Date(),
        }
        patchSession(sessionId, [...withUser, assistantMessage])
      } catch {
        toast({
          title: "No response",
          description: "MedicAI could not be reached. Your message is still here — try sending again.",
          variant: "destructive",
        })
      } finally {
        setIsTyping(false)
      }
    },
    [activeSession, inputValue, selectedFile, isTyping, patchSession, toast]
  )

  const loadMoreSessions = () => {
    setIsLoadingMore(true)
    setTimeout(() => {
      setDisplayCount((prev) => prev + SESSIONS_PER_PAGE)
      setIsLoadingMore(false)
    }, 400)
  }

  if (!mounted) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-000">
        <span className="sr-only">Loading MedicAI</span>
      </div>
    )
  }

  return (
    <div className="relative flex h-[100dvh] overflow-hidden bg-ink-000">
      <AmbientField />

      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <AppSidebar
          visibleSessions={visibleSessions}
          activeSession={activeSession}
          setActiveSession={setActiveSession}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          loadMoreSessions={loadMoreSessions}
          onNewSession={handleNewSession}
        />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
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
              <AppSidebar
                visibleSessions={visibleSessions}
                activeSession={activeSession}
                setActiveSession={(s) => {
                  setActiveSession(s)
                  setSidebarOpen(false)
                }}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                loadMoreSessions={loadMoreSessions}
                onNewSession={handleNewSession}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex min-w-0 flex-1 flex-col">
        <SessionHeader mode={mode} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        <div ref={scrollRef} className={cn("min-h-0 flex-1 overflow-y-auto")}>
          {messages.length === 0 ? (
            <EmptyState key={activeSession.id} mode={mode} onPick={(t) => handleSend(t)} />
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
            onFileSelect={(f) => {
              setSelectedFile(f)
              toast({ title: "Report attached", description: f.name })
            }}
            onFileClear={() => setSelectedFile(null)}
          />
        </div>
      </main>
    </div>
  )
}
