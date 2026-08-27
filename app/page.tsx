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
import { prepareAttachment, streamChatMessage } from "@/lib/chat-api"
import { loadChatHistory, saveChatHistory } from "@/lib/local-chat-history"
import type { ChatType, ChatSession, Message } from "@/types/chat"
import { cn } from "@/lib/utils"

const ChatMessages = dynamic(
  () => import("@/components/chat/chat-messages").then((module) => module.ChatMessages),
  { ssr: false }
)

/**
 * Tokens arrive faster than the eye resolves them and every one of them
 * re-parses the Markdown, so deltas are batched to roughly three frames.
 * Slower reads as laggy; faster buys nothing.
 */
const STREAM_FLUSH_MS = 50

/** A stop the user asked for is not a failure, and must not raise a toast. */
function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError"
}

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
  /** The id of the message currently receiving tokens, or null. */
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const storageWarningShown = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const pinnedRef = useRef(true)
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
    // A stream rewrites the active message every few frames; serialising the
    // whole history that often would jank the reveal. The final state is
    // written when streamingId falls back to null.
    if (streamingId) return
    const saved = saveChatHistory(chatSessions, activeSessionId)
    if (!saved && !storageWarningShown.current) {
      storageWarningShown.current = true
      toast({
        title: "History could not be saved",
        description: "Your browser storage may be full or disabled.",
        variant: "destructive",
      })
    }
  }, [activeSessionId, chatSessions, historyReady, streamingId, toast])

  // Follow the conversation, but never yank the viewport away from someone who
  // has scrolled up on purpose to re-read an earlier answer.
  useEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const onScroll = () => {
      pinnedRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 120
    }
    element.addEventListener("scroll", onScroll, { passive: true })
    return () => element.removeEventListener("scroll", onScroll)
  }, [historyReady])

  useEffect(() => {
    const element = scrollRef.current
    if (!element || !pinnedRef.current) return
    element.scrollTo({
      top: element.scrollHeight,
      // Smooth scrolling cannot keep up with a stream landing every few
      // frames — mid-reply it has to be an instant jump.
      behavior: streamingId || messages.length <= 1 ? "auto" : "smooth",
    })
  }, [messages, isTyping, streamingId])

  // Leaving the page mid-reply should stop the request, not orphan it.
  useEffect(() => () => abortRef.current?.abort(), [])

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

  /**
   * Rewrites one message in place. `patchSession` replaces the whole array,
   * which is the wrong shape for a value that changes every few frames.
   */
  const setMessageContent = useCallback((sessionId: string, messageId: string, content: string) => {
    const now = new Date()
    setChatSessions((previous) =>
      previous.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              messages: session.messages.map((message) =>
                message.id === messageId ? { ...message, content } : message
              ),
              lastMessage: content,
              timestamp: now,
            }
          : session
      )
    )
  }, [])

  const handleStop = useCallback(() => abortRef.current?.abort(), [])

  const handleSelectSession = useCallback((session: ChatSession) => {
    pinnedRef.current = true
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

      pinnedRef.current = true
      patchSession(session.id, withUser, automaticTitle)
      setInputValue("")
      setSelectedFile(null)
      setIsTyping(true)

      const controller = new AbortController()
      abortRef.current = controller

      // The reply is written straight into the transcript as it arrives. The
      // bubble is only created on the first token, so the thinking indicator
      // is never replaced by an empty one.
      const assistantId = crypto.randomUUID()
      const startedAt = new Date()
      let answer = ""
      let created = false
      let flushTimer: ReturnType<typeof setTimeout> | null = null

      const commit = () => {
        if (flushTimer !== null) {
          clearTimeout(flushTimer)
          flushTimer = null
        }
        if (created) {
          setMessageContent(session.id, assistantId, answer)
          return
        }
        created = true
        setStreamingId(assistantId)
        const assistantMessage: Message = {
          id: assistantId,
          content: answer,
          sender: "assistant",
          timestamp: startedAt,
        }
        setChatSessions((previous) =>
          previous.map((item) =>
            item.id === session.id
              ? {
                  ...item,
                  messages: [...item.messages, assistantMessage],
                  lastMessage: answer,
                  timestamp: new Date(),
                }
              : item
          )
        )
      }

      try {
        answer = await streamChatMessage(
          {
            type: session.type,
            message: text,
            history: session.messages.map(({ sender, content }) => ({ sender, content })),
            attachment,
          },
          {
            signal: controller.signal,
            onDelta: (delta) => {
              answer += delta
              if (flushTimer === null) flushTimer = setTimeout(commit, STREAM_FLUSH_MS)
            },
          }
        )
        commit()
      } catch (error) {
        // Whatever already arrived is real and stays on screen, whether the
        // user stopped the reply or the connection did.
        if (answer) commit()
        else if (flushTimer !== null) clearTimeout(flushTimer)

        if (!isAbortError(error)) {
          toast({
            title: "No response",
            description:
              error instanceof Error
                ? error.message
                : "MedicAI could not be reached. Your message is saved — please try again.",
            variant: "destructive",
          })
        }
      } finally {
        abortRef.current = null
        setStreamingId(null)
        setIsTyping(false)
      }
    },
    [activeSession, inputValue, selectedFile, isTyping, patchSession, setMessageContent, toast]
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
            <ChatMessages messages={messages} isTyping={isTyping} streamingId={streamingId} />
          )}
        </div>

        <div className="mx-auto w-full max-w-3xl">
          <Composer
            mode={mode}
            value={inputValue}
            onChange={setInputValue}
            onSend={() => handleSend()}
            onStop={handleStop}
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
