"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Send,
  File,
  X,
  Volume2,
  MessageCircle,
  ClipboardList,
  Heart,
  Settings,
  PlusCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { ChatType, ChatSession, Message } from '../types/chat'
import { sendChatMessage, uploadFile } from '../lib/chat-api'
import { MedicalLogo } from "@/components/medical-logo"
import { useMobileContext } from "@/components/providers/mobile-provider"

// Dynamic imports
const ChatHistory = dynamic(() => import('@/components/chat/chat-history').then(mod => mod.ChatHistory), {
  ssr: false,
  loading: () => <div>Loading chat history...</div>
})

const ChatMessages = dynamic(() => import('@/components/chat/chat-messages').then(mod => mod.ChatMessages), {
  ssr: false,
  loading: () => <div>Loading messages...</div>
})

const AnimationHeader = dynamic(() => import('@/components/animation-header').then(mod => mod.AnimationHeader), {
  ssr: false,
  loading: () => null
})

// Number of sessions to show initially and when loading more
const SESSIONS_PER_PAGE = 5

// Update type mapping
const chatTypeMap: Record<ChatType, ChatType> = {
  'symptom-checker': 'symptom-checker',
  'report-analyzer': 'report-analyzer',
  'mental-health': 'mental-health',
}

export default function MedicAI() {
  // Initialize with a default session
  const getDefaultSession = (): ChatSession => ({
    id: Date.now().toString(),
    type: 'symptom-checker',
    title: 'New Chat',
    lastMessage: "Hello! How can I help you with your medical concerns today?",
    timestamp: new Date(),
    messages: [
      {
        id: "1",
        content: "Hello! How can I help you with your medical concerns today?",
        sender: "assistant",
        timestamp: new Date(),
      },
    ],
  })

  // Chat sessions state - start with just one default session
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([getDefaultSession()])
  const [visibleSessions, setVisibleSessions] = useState<ChatSession[]>([])
  const [displayCount, setDisplayCount] = useState(SESSIONS_PER_PAGE)
  const [hasMore, setHasMore] = useState(false)

  // Current active session
  const [activeSession, setActiveSession] = useState<ChatSession>(chatSessions[0])

  // Message states
  const [messages, setMessages] = useState<Message[]>(chatSessions[0].messages)
  const [inputValue, setInputValue] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [mounted, setMounted] = useState(false)

  // UI state
  const [showNewChatMenu, setShowNewChatMenu] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isMobile = useMobileContext()
  const { toast } = useToast()

  // Handle mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update visible sessions when display count changes
  useEffect(() => {
    if (!mounted) return;
    const sorted = [...chatSessions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    setVisibleSessions(sorted.slice(0, displayCount))
    setHasMore(displayCount < chatSessions.length)
  }, [chatSessions, displayCount, mounted])

  // Update messages when active session changes
  useEffect(() => {
    if (!mounted) return;
    setMessages(activeSession.messages)
  }, [activeSession, mounted])

  // Update active session messages when messages change
  useEffect(() => {
    if (!mounted) return;
    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === activeSession.id
          ? { ...session, messages, lastMessage: messages[messages.length - 1]?.content || "" }
          : session,
      ),
    )
  }, [messages, activeSession.id, mounted])

  // Scroll to bottom of messages
  useEffect(() => {
    if (!mounted) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, mounted])

  // Render loading state while not mounted
  if (!mounted) {
    return <div>Loading...</div> // Or your loading component
  }

  // Load more sessions
  const loadMoreSessions = () => {
    setIsLoadingMore(true)

    // Simulate loading delay
    setTimeout(() => {
      setDisplayCount((prev) => prev + SESSIONS_PER_PAGE)
      setIsLoadingMore(false)
    }, 500)
  }

  // Create a new chat session
  const createNewSession = (type: ChatType) => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      type,
      title: getSessionTitle(type),
      lastMessage: getInitialMessage(type),
      timestamp: new Date(),
      messages: [
        {
          id: "1",
          content: getInitialMessage(type),
          sender: "assistant",
          timestamp: new Date(),
        },
      ],
    }

    setChatSessions((prev) => [newSession, ...prev])
    setActiveSession(newSession)
    setMessages(newSession.messages)
    setShowNewChatMenu(false)
  }

  // Get initial message based on chat type
  const getInitialMessage = (type: ChatType) => {
    switch (type) {
      case 'symptom-checker':
        return "Hello! How can I help you with your medical concerns today?"
      case 'report-analyzer':
        return "Please upload your medical report and I'll analyze it for you."
      case 'mental-health':
        return "Welcome to the mental health support section. How are you feeling today?"
    }
  }

  // Get session title based on chat type
  const getSessionTitle = (type: ChatType) => {
    switch (type) {
      case 'symptom-checker':
        return "New Medical Consultation"
      case 'report-analyzer':
        return "New Report Analysis"
      case 'mental-health':
        return "New Mental Health Support"
    }
  }

  // Simulate typing indicator
  const simulateTyping = (callback: () => void) => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      callback()
    }, 1500)
  }

  // Update handleSendMessage function
  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedFile) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      hasFile: !!selectedFile,
      fileName: selectedFile?.name
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')

    let fileUrl: string | undefined
    if (selectedFile) {
      try {
        fileUrl = await uploadFile(selectedFile)
      } catch (error) {
        toast({
          title: 'Error uploading file',
          description: 'Failed to upload the file. Please try again.',
          variant: 'destructive'
        })
        return
      }
    setSelectedFile(null)
    }

    setIsTyping(true)

    try {
      const response = await sendChatMessage({
        type: activeSession.type,
        message: inputValue,
        fileUrl
      })

      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: response.message,
        sender: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Update the active session and chat sessions
      const updatedSession = {
        ...activeSession,
        lastMessage: response.message,
        messages: [...activeSession.messages, newMessage, assistantMessage]
      }
      
      setActiveSession(updatedSession)
      setChatSessions(prev =>
        prev.map(session =>
          session.id === activeSession.id ? updatedSession : session
        )
      )
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsTyping(false)
    }
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      toast({
        title: `Medical report uploaded`,
        description: `${file.name} has been uploaded successfully.`,
      })
    }
  }

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Render chat messages
  const renderMessages = () => (
    <ChatMessages
      messages={messages}
      isTyping={isTyping}
    />
  )

  // Render input area with file upload for report analyzer
  const renderReportInput = () => (
    <div className="p-4 border-t border-white/10">
      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center justify-between p-2.5 bg-white/5 rounded-lg border border-white/10"
        >
          <div className="flex items-center gap-2">
            <File size={16} className="text-white/60" />
            <span className="text-sm truncate max-w-[200px] text-light">{selectedFile.name}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10" onClick={() => setSelectedFile(null)}>
            <X size={12} />
          </Button>
        </motion.div>
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 bg-white/5 border-white/10 hover:bg-white/10"
        >
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,image/*" />
          <File size={16} className="text-gray-400" />
        </Button>
        <Input
          placeholder="Ask about your medical report..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          className="bg-white/5 border-white/10 text-light placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/30"
        />
        <Button
          onClick={handleSendMessage}
          disabled={(inputValue.trim() === "" && !selectedFile) || isTyping}
          className="shrink-0 bg-white/10 hover:bg-white/20 transition-colors border border-white/20"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  )

  // Render standard input area without file upload
  const renderStandardInput = (placeholder: string) => (
    <div className="p-4 border-t border-white/10">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          className="bg-white/5 border-white/10 text-light placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/30"
        />
        <Button
          onClick={handleSendMessage}
          disabled={inputValue.trim() === "" || isTyping}
          className="shrink-0 bg-white/10 hover:bg-white/20 transition-colors border border-white/20"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  )

  // Render chat history in sidebar with load more button
  const renderChatHistory = () => (
    <ChatHistory
      visibleSessions={visibleSessions}
      activeSession={activeSession}
      setActiveSession={setActiveSession}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      loadMoreSessions={loadMoreSessions}
    />
  )

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex h-screen w-full bg-black">
        <Sidebar className="z-50 w-64 flex-shrink-0 border-r border-white/10 glass-dark">
          <div className="h-14 px-3 border-b border-white/10 flex items-center gap-2.5">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-lg bg-white/5" />
              <svg
                viewBox="0 0 32 32"
                fill="none"
                className="w-7 h-7 relative z-10"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="16" cy="16" r="14" stroke="url(#navGrad1)" strokeWidth="1.5" fill="none" />
                <circle cx="16" cy="16" r="10" stroke="url(#navGrad2)" strokeWidth="1.5" fill="none" />
                <circle cx="16" cy="16" r="6" stroke="url(#navGrad3)" strokeWidth="1.5" fill="none" />
                <path d="M16 10 L16 22 M10 16 L22 16" stroke="url(#navGrad4)" strokeWidth="1.5" strokeLinecap="round" />
                <defs>
                  <linearGradient id="navGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#e5e5e5" stopOpacity="0.9" />
                  </linearGradient>
                  <linearGradient id="navGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#d4d4d4" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="navGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#c4c4c4" stopOpacity="0.7" />
                  </linearGradient>
                  <linearGradient id="navGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#d4d4d4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white tracking-tight">
                MedicAI
              </span>
              <span className="text-[10px] text-white/50 font-medium uppercase tracking-wider">
                Healthcare AI
              </span>
            </div>
          </div>

          <SidebarContent className="flex flex-col h-[calc(100vh-3.5rem)]">
            <div className="p-2">
            <Button
              variant="outline"
                className="w-full justify-start gap-2 bg-white/5 border-white/10 hover:bg-white/10 text-white text-sm"
              onClick={() => setShowNewChatMenu(!showNewChatMenu)}
            >
              <PlusCircle size={16} className="text-gray-400" />
              <span className="font-normal">New Chat</span>
              <ChevronDown size={14} className={cn("ml-auto transition-transform text-gray-400", showNewChatMenu && "rotate-180")} />
            </Button>

            <AnimatePresence>
              {showNewChatMenu && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-2"
                >
                    <div className="space-y-1">
                      <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-white/5 text-gray-200" onClick={() => createNewSession('symptom-checker')}>
                        <MessageCircle size={16} className="text-white/60" />
                        <span>General Chat</span>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-white/5 text-gray-200" onClick={() => createNewSession('report-analyzer')}>
                        <ClipboardList size={16} className="text-white/60" />
                        <span>Report Analyzer</span>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-white/5 text-gray-200" onClick={() => createNewSession('mental-health')}>
                        <Heart size={16} className="text-white/60" />
                        <span>Mental Health</span>
                      </Button>
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>

            <SidebarSeparator className="my-2 bg-white/10" />

            <div className="flex-1 overflow-y-auto">
            {renderChatHistory()}
            </div>
          </SidebarContent>

          <SidebarFooter className="p-2 border-t border-white/10">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => {}} className="w-full justify-start gap-2 hover:bg-white/5 text-gray-400 text-sm" tooltip="Settings">
                    <Settings size={16} />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <div className="flex-1 p-6 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSession.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <Card className="flex flex-col h-full glass-dark rounded-2xl overflow-hidden">
                  <AnimationHeader />
                  <div className="flex-1 overflow-y-auto min-h-0">
                    {renderMessages()}
                  </div>
                  {activeSession.type === "report-analyzer"
                    ? renderReportInput()
                    : renderStandardInput(
                        activeSession.type === "symptom-checker"
                          ? "Type your medical question..."
                          : "Share how you're feeling today...",
                      )}
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
