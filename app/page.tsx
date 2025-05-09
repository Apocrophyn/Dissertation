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
  Moon,
  Sun,
  History,
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
import { useTheme } from "next-themes"
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

  // Generate a larger set of sample chat sessions
  const generateSampleSessions = () => {
    const sessions: ChatSession[] = []
  const types: ChatType[] = ['symptom-checker', 'report-analyzer', 'mental-health']
  
  for (let i = 0; i < 20; i++) {
    const type = types[i % 3]
      sessions.push({
      id: (i + 1).toString(),
        type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')} Session ${i + 1}`,
      lastMessage: `Last message for session ${i + 1}`,
      timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        messages: [
          {
            id: "1",
          content: `Initial message for session ${i + 1}`,
          sender: "assistant",
          timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          },
        ],
      })
    }
    return sessions
  }

export default function MedicAI() {
  // Chat sessions state
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(generateSampleSessions)
  const [visibleSessions, setVisibleSessions] = useState<ChatSession[]>([])
  const [displayCount, setDisplayCount] = useState(SESSIONS_PER_PAGE)
  const [hasMore, setHasMore] = useState(true)

  // Current active session
  const [activeSession, setActiveSession] = useState<ChatSession>(chatSessions[0])

  // Message states
  const [messages, setMessages] = useState<Message[]>(activeSession.messages)
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
  const { theme, setTheme } = useTheme()

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
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/30 rounded"
        >
          <div className="flex items-center gap-2">
            <File size={18} className="text-blue-500" />
            <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedFile(null)}>
            <X size={14} />
          </Button>
        </motion.div>
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,image/*" />
          <File size={18} className="text-blue-500" />
        </Button>
        <Input
          placeholder="Ask about your medical report..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus-visible:ring-blue-500"
        />
        <Button
          onClick={handleSendMessage}
          disabled={(inputValue.trim() === "" && !selectedFile) || isTyping}
          className="shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
        >
          <Send size={18} />
        </Button>
      </div>
    </div>
  )

  // Render standard input area without file upload
  const renderStandardInput = (placeholder: string) => (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus-visible:ring-blue-500"
        />
        <Button
          onClick={handleSendMessage}
          disabled={inputValue.trim() === "" || isTyping}
          className="shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
        >
          <Send size={18} />
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
      <div className="flex h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Sidebar className="z-50 w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
          <div className="h-16 px-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <div className={`absolute inset-0 rounded-lg ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'}`} />
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className={`w-7 h-7 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4C8 4 4 8 4 12C4 16 8 20 12 20C16 20 20 16 20 12C20 8 16 4 12 4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M12 8V16M8 12H16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M12 7C14 7 15 8 15 10C15 12 13 13 12 13C11 13 9 12 9 10C9 8 10 7 12 7Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M12 13C14 13 15 14 15 16C15 18 13 19 12 19C11 19 9 18 9 16C9 14 10 13 12 13Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="ml-3 flex flex-col">
              <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Medic AI
              </span>
              <span className={`text-xs ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                Healthcare Assistant
              </span>
            </div>
          </div>

          <SidebarContent className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="p-2">
            <Button
              variant="outline"
                className="w-full justify-start gap-2"
              onClick={() => setShowNewChatMenu(!showNewChatMenu)}
            >
              <PlusCircle size={18} className="text-blue-500" />
              <span>New Chat</span>
              <ChevronDown size={16} className={cn("ml-auto transition-transform", showNewChatMenu && "rotate-180")} />
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
                      <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => createNewSession('symptom-checker')}>
                        <MessageCircle size={16} className="text-blue-500" />
                        <span>General Chat</span>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => createNewSession('report-analyzer')}>
                        <ClipboardList size={16} className="text-green-500" />
                        <span>Report Analyzer</span>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => createNewSession('mental-health')}>
                        <Heart size={16} className="text-red-500" />
                        <span>Mental Health</span>
                      </Button>
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>

            <SidebarSeparator className="my-2" />

            <div className="flex-1 overflow-y-auto">
            {renderChatHistory()}
            </div>
          </SidebarContent>

          <SidebarFooter className="p-2 border-t border-gray-200 dark:border-gray-800">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-full justify-start gap-2"
                  tooltip="Toggle Theme"
                >
                    {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                  <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => {}} className="w-full justify-start gap-2" tooltip="Settings">
                    <Settings size={18} />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col h-screen w-[calc(100%-20rem)] ml-80">
          <div className="flex-1 p-4 h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSession.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <Card className="flex flex-col h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
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
